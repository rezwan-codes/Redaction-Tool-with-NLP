from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from docx import Document
import fitz  # PyMuPDF

# Import updated redaction functions
from redact import redact_text, extract_entities_table

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend is running!"}

# Extract PDF text
def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

# Extract DOCX text
def extract_text_from_docx(file):
    doc = Document(file)
    text = "\n".join(p.text for p in doc.paragraphs)
    return text

# Redaction Route
@app.post("/redact")
async def redact(
    text: str = Form(None),
    file: UploadFile = File(None),
    mode: str = Form("placeholder")  # <-- New mode parameter: "placeholder" or "empty"
):
    # Get Text Source
    if file:
        if file.filename.lower().endswith(".pdf"):
            extracted = extract_text_from_pdf(file.file)
        elif file.filename.lower().endswith(".docx"):
            extracted = extract_text_from_docx(file.file)
        else:
            return JSONResponse(
                {"error": "Only PDF and DOCX files are supported."},
                status_code=400,
            )
    elif text:
        extracted = text
    else:
        return JSONResponse(
            {"error": "No input text or file provided."},
            status_code=400,
        )

    # Redact text
    # Pass the mode to redact_text
    redacted = redact_text(extracted, mode=mode)

    # Extract entities for table
    entities_table = extract_entities_table(extracted)

    # Return all data
    return {
        "original": extracted,
        "redacted": redacted,
        "entities": entities_table
    }
