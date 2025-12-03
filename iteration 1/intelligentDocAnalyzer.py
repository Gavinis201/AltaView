from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
import os
import time

start_time = time.time()

# Initialize LLM
llm1 = OllamaLLM(model="qwen2.5:7b", temperature=0.0)
llm2 = OllamaLLM(model="llama3", temperature=0.0, format="json")

# Chunk Prompt template
chunkSummaryTemplateOld = """
You are a compliance analyst who reviews documents to determine whether and how they align with the 2024 SEC climate regulation.
Using the supplied text and when related data are found, extract relevant data and place in their respective lists in the following format:
- climate_risks = []
- emissions = []
- targets_and_goals = []
- governance = []
- financials = []
- mitigation = []

Key Definitions for these categories:
Climate_risks: 
- Material Climate Risks: Climate-related threats that could significantly affect business operations or financials.
- Strategic Impact: How climate risks influence business plans, models, or long-term goals.

Emissions:
- Greenhouse Gas Emissions Disclosures: Quantitative data on Scope 1 (direct) and Scope 2 (indirect from purchased energy) greenhouse gas emissions. Scope 3 (value chain) emissions may also be included.

Target and Goals:
- Target and Goals: Statements indicating where the company would like to be regarding climate-related issues and be what date or timeframe.

Governance:
- Board Oversight: Statements indicating whether and how the board of directors oversees climate-related risks. May include board committees, frequency of review, and integration into enterprise risk management.
- Management’s Role: Details on how senior executives or designated personnel identify, assess, and manage climate-related risks. Includes organizational structures, reporting lines, and performance metrics tied to climate goals.

Financials:
- Financial impact: Disclosures regarding the financial resources used or to be used in addressing all climate-related risks and mitigation strategies.

Mitigation:
- Transition Plans and Scenario Analysis: Voluntary disclosures outlining how the company plans to transition to a lower-carbon economy. Includes use of internal carbon pricing, scenario modeling, or alignment with external frameworks (e.g., TCFD, Net Zero).

Do not be verbose.  Do not add comments after each list.  The text might not contain these data.  If related data are not found, simply leave the list empty."  

Text:
{text}
"""

chunkSummaryTemplate = """You are a compliance analyst extracting climate-related data per 2024 SEC climate regulations.

TASK: Extract relevant data from the text and output ONLY valid Python lists in the exact format shown below. Include data only if explicitly present in the text.

OUTPUT FORMAT (copy exactly):
climate_risks = []
emissions = []
targets_and_goals = []
governance = []
financials = []
mitigation = []

EXTRACTION RULES:

climate_risks:
- Material climate-related threats to operations or financials (physical risks: floods, wildfires, extreme weather; transition risks: policy changes, market shifts, technology, reputation)
- Statements on how climate risks affect business strategy, operations, or financial planning
- Risk assessment methodologies or materiality determinations

emissions:
- Scope 1 emissions: Direct GHG emissions from owned/controlled sources (include numbers, units, methodology)
- Scope 2 emissions: Indirect GHG from purchased electricity, steam, heating, cooling (include numbers, units, location/market-based)
- Scope 3 emissions: Value chain emissions (if disclosed)
- Emission intensity metrics, baseline years, verification status

targets_and_goals:
- Specific reduction targets with numeric values and timeframes (e.g., "50% reduction by 2030")
- Net-zero commitments or carbon neutrality goals with dates
- Interim milestones or short/medium/long-term objectives
- Baseline years for targets

governance:
- Board oversight: committees, frequency of climate discussions, board expertise
- Management responsibility: titles/roles, organizational structure, reporting mechanisms
- Climate-related KPIs tied to executive compensation
- Risk management integration processes

financials:
- Capital expenditures or investments for climate initiatives (with amounts)
- Costs of climate-related impacts or risks (quantified)
- R&D spending on low-carbon technologies or adaptation
- Insurance costs, asset write-downs, or stranded asset considerations

mitigation:
- Transition plans: strategies to reduce emissions or adapt operations
- Scenario analysis: climate scenarios used (e.g., 1.5°C, 2°C pathways)
- Internal carbon pricing mechanisms and rates
- Technology investments, energy efficiency programs, renewable energy adoption
- Alignment with frameworks (TCFD, SBTi, CDP, GRI)

CRITICAL INSTRUCTIONS:
- Extract ONLY information explicitly stated in the text
- Use exact quotes or very close paraphrasing
- Include numerical values, dates, and units when present
- If a category has no relevant data, leave list empty: []
- Output ONLY the six list assignments, nothing else
- Do not add explanations, comments, or markdown
- Each list item should be a brief, factual string

Text to analyze:
{text}
"""
chunkSummaryTemplatev2 = """Extract all climate-related terminology, phrases, and keywords from the text below.

OUTPUT FORMAT: Return ONLY a valid Python list of strings. Each item should be a relevant term, phrase, metric, or concept.

Include:
- Specific climate risks (e.g., "flooding", "sea level rise", "extreme heat")
- Emission terms (e.g., "Scope 1 emissions", "carbon dioxide", "methane")
- Targets and goals (e.g., "net zero by 2050", "50% reduction")
- Governance terms (e.g., "Climate Committee", "board oversight")
- Financial terms (e.g., "$50M climate investment", "carbon pricing")
- Metrics and numbers with context (e.g., "2.5 million metric tons CO2e")

RULES:
- Extract exact phrases as they appear
- Include quantitative data with units
- Keep technical terminology precise
- Remove generic words like "the", "and", "of"
- Return ONLY the Python list, nothing else

Text:
{text}

Output (Python list only):"""

# JSON Prompt template
buildMasterJSONOld = """
You are a compliance analyst who reviews documents to determine whether and how they align with the 2024 SEC climate regulation.
The text you are given represents the climate-related data already extracted from various sections of a company's 10K report. 
Gather the unique values for each list, and return only a single, master JSON object that describes the company's statements with these fields:
- climate_risks
- ghg_emissions
- targets_and_goals
- governance
- strategy_and_risk_management
- financial_impact

Do not provide additional explanation; only provide the JSON object.

Text:
{text}
"""

buildMasterJSON = """You are a compliance analyst consolidating climate data from a 10-K report.

TASK: Merge all extracted data below into one JSON object. Remove duplicates, preserve specific numbers/dates, combine similar statements.

OUTPUT (valid JSON only, no markdown):
{{
  "climate_risks": [],
  "ghg_emissions": [],
  "targets_and_goals": [],
  "governance": [],
  "strategy_and_risk_management": [],
  "financial_impact": []
}}

RULES:
- Each array contains unique strings describing the company's disclosures
- Combine near-duplicate statements into one comprehensive statement
- Preserve all specific numbers, dates, percentages, and units
- Keep most detailed version when overlaps occur
- Output ONLY the JSON object, nothing else

Extracted data:
{text}
"""

chunkSummaryPrompt = PromptTemplate.from_template(chunkSummaryTemplatev2)
jsonPrompt = PromptTemplate.from_template(buildMasterJSON)

chunkSummaryChain: Runnable = chunkSummaryPrompt | llm1
jsonChain: Runnable = jsonPrompt | llm1

pdf_dir = "files/10Ks/"
pdf_files = [f for f in os.listdir(pdf_dir)]

outputFile = "files/10Kreport.txt"

keywords = [
    "climate",
    "emission",
    "greenhouse",
    "ghg",
    "scope 1",
    "scope 2",
    "scope 3",
    "weather",
    "natural disaster",
    "act of god",
    "acts of god",
    "tornado",
    "hurricane",
    "earthquake",
    "wildfire",
    "drought",
    "flood",
    "temperature",
    "sea level",
    "sea-level",
    "carbon",
    "warming",
    "net zero",
    "net-zero",
    "methane",
    "precipitation",
    "co2",
    "clean",
    "green",
    "earth"
]

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=300,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],  # Try these in order
    is_separator_regex=False,
)

def extract_text_from_pdf(file):
    filepath = os.path.join(pdf_dir, file)
    reader = PdfReader(filepath)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    #print(text)
    return text

def chunk_text(text):
    chunks = text_splitter.split_text(text)
    print(f"Num of chunks: {len(chunks)} \n")
    return chunks

def create_summaries(chunks):
    chunkSummaries = ""
    j = 0
    for i, chunk in enumerate(chunks):
        #print(f"Keyword check of chunk: {i} \n")
        for keyword in keywords:
            if keyword.casefold() in chunk.casefold():
                print(f"Keyword {keyword} found in chunk: {i}")
                j += 1
                result = chunkSummaryChain.invoke({"text": chunk})
                chunkSummaries += result
                break
    print(f"Num of key chunks: {j} \n")
    return chunkSummaries

def create_master_json(chunkSummaries):
    print(f"Length of summaries: {len(chunkSummaries)} characters or ~ {len(chunkSummaries)/4} tokens")
    summaryJson = jsonChain.invoke({"text": chunkSummaries}) 
    return summaryJson   

# main call here
for i, file in enumerate(pdf_files):
    print(f"Extracting data from:{file} \n")
    text = extract_text_from_pdf(file)
    chunkedText = chunk_text(text)
    chunkSummaries = create_summaries(chunkedText)
    summaryJSON = create_master_json(chunkSummaries)
    with open(outputFile, 'a', encoding='utf-8') as f:
        f.write(f"\n >>>>>>> Final output for {file} <<<<<<<< \n\n")
        f.write(summaryJSON)
    #print(summaryJSON)

end_time = time.time()
elapsed_time = end_time - start_time
print(f"Elapsed time: {elapsed_time:.2f} seconds")