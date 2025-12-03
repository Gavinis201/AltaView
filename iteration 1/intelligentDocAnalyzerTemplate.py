from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
import os
import time

start_time = time.time()

# Initialize LLM
llm1 = OllamaLLM(model=#replace, temperature=#replace)
llm2 = OllamaLLM(model=#replace, temperature=#replace)

# Chunk Prompt template
chunkSummaryTemplate = """

#replace

Text:
{text}

"""

# JSON Prompt template
buildMasterJSONTemplate = """

#replace

Extracted data:
{text}
"""

chunkSummaryPrompt = PromptTemplate.from_template(chunkSummaryTemplate)
jsonPrompt = PromptTemplate.from_template(buildMasterJSONTemplate)

chunkSummaryChain: Runnable = chunkSummaryPrompt | llm1
jsonChain: Runnable = jsonPrompt | llm1

pdf_dir = "files/10Ks/"
pdf_files = [f for f in os.listdir(pdf_dir)]

outputFile = "files/10Kreport.txt"

keywords = [
    #replace
]

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=#replace,
    chunk_overlap=#replace,
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
    return text

def chunk_text(text):
    chunks = text_splitter.split_text(text)
    print(f"Num of chunks: {len(chunks)} \n")
    return chunks

def create_summaries(chunks):
    chunkSummaries = ""
    j = 0
    for i, chunk in enumerate(chunks):
        #Send chunks to be summarized only if at least one keyword appears in the chunk
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

# main flow
for i, file in enumerate(pdf_files):
    print(f"Extracting data from:{file} \n")
    text = extract_text_from_pdf(file)
    chunkedText = chunk_text(text)
    chunkSummaries = create_summaries(chunkedText)
    summaryJSON = create_master_json(chunkSummaries)
    with open(outputFile, 'a', encoding='utf-8') as f:
        f.write(f"\n >>>>>>> Final output for {file} <<<<<<<< \n\n")
        f.write(summaryJSON)

end_time = time.time()
elapsed_time = end_time - start_time
print(f"Elapsed time: {elapsed_time:.2f} seconds")