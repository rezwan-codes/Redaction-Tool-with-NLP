import spacy
import re

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = spacy.blank("en")
    print("spaCy model not found, using blank model.")

# ---------------------------
# Regex patterns
# ---------------------------
NAME_PATTERN = r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b"

EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_PATTERN = r"(\+\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}"
IP_PATTERN = r"\b\d{1,3}(\.\d{1,3}){3}\b"
CREDIT_CARD_PATTERN = r"\b(?:\d{4}[- ]?){3,4}\d{4}\b"
DATE_PATTERN = r"\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b"
TIME_PATTERN = r"\b\d{1,2}:\d{2}\b"
URL_PATTERN = r"(https?://[^\s]+)"

# Known locations
LOCATION_WORDS = [
    "Dhaka", "Chittagong", "Khulna", "Cardiff", "Croydon", "Bath", "Exeter",
    "Watford", "Epsom", "Hounslow", "Newport", "Salford", "Stockport",
    "Burnley", "Chesterfield", "Dagenham", "Brentwood", "Gravesend", "Harrow",
    "Redhill", "Barnet", "Walthamstow", "Chicago", "London", "Brooklyn",
    "Los Angeles"
]

# ---------------------------
# Redact Text Function
# ---------------------------
def redact_text(text: str, mode: str = "placeholder") -> str:
    """
    Redact sensitive information.
    mode = "placeholder" -> replace with [NAME], [EMAIL], etc.
    mode = "empty" -> remove sensitive info completely (empty string)
    """
    placeholder = lambda x: x if mode == "placeholder" else ""

    # 1. PERSON names
    doc = nlp(text)
    persons = set()
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            persons.add(ent.text.strip())
    for name in sorted(persons, key=len, reverse=True):
        text = re.sub(rf"\b{re.escape(name)}\b", placeholder("[NAME]"), text)

    # 2. LOCATION
    for loc in LOCATION_WORDS:
        text = re.sub(rf"(?<=Location:\s){re.escape(loc)}", placeholder("[LOCATION]"), text)
        text = re.sub(rf"\b{re.escape(loc)}\b", placeholder("[LOCATION]"), text, flags=re.IGNORECASE)

    # 3. EMAIL
    text = re.sub(EMAIL_PATTERN, placeholder("[EMAIL]"), text)

    # 4. IP_ADDRESS
    text = re.sub(IP_PATTERN, placeholder("[IP_ADDRESS]"), text)

    # 5. CREDIT_CARD
    text = re.sub(CREDIT_CARD_PATTERN, placeholder("[CARD_NUMBER]"), text)

    # 6. PHONE_NUMBER
    text = re.sub(PHONE_PATTERN, placeholder("[PHONE]"), text)

    # 7. DATE
    text = re.sub(DATE_PATTERN, placeholder("[DATE]"), text)

    # 8. TIME
    text = re.sub(TIME_PATTERN, placeholder("[TIME]"), text)

    # 9. URL
    text = re.sub(URL_PATTERN, placeholder("[URL]"), text)

    return text

# ---------------------------
# Extract Entities Table
# ---------------------------
def extract_entities_table(text: str) -> list:
    entities = []

    # PERSON names using spaCy
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            entities.append({
                "entity": "[NAME]",
                "text": ent.text,          # FIXED
                "start": ent.start_char,
                "end": ent.end_char
            })

    # LOCATION
    for loc in LOCATION_WORDS:
        for match in re.finditer(rf"\b{re.escape(loc)}\b", text, re.IGNORECASE):
            entities.append({
                "entity": "[LOCATION]",
                "text": match.group(),     # FIXED
                "start": match.start(),
                "end": match.end()
            })

    # EMAIL
    for match in re.finditer(EMAIL_PATTERN, text):
        entities.append({
            "entity": "[EMAIL]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # PHONE
    for match in re.finditer(PHONE_PATTERN, text):
        entities.append({
            "entity": "[PHONE]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # IP_ADDRESS
    for match in re.finditer(IP_PATTERN, text):
        entities.append({
            "entity": "[IP_ADDRESS]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # CARD_NUMBER
    for match in re.finditer(CREDIT_CARD_PATTERN, text):
        entities.append({
            "entity": "[CARD_NUMBER]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # DATE
    for match in re.finditer(DATE_PATTERN, text):
        entities.append({
            "entity": "[DATE]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # TIME
    for match in re.finditer(TIME_PATTERN, text):
        entities.append({
            "entity": "[TIME]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    # URL
    for match in re.finditer(URL_PATTERN, text):
        entities.append({
            "entity": "[URL]",
            "text": match.group(),         # FIXED
            "start": match.start(),
            "end": match.end()
        })

    entities.sort(key=lambda x: x["start"])
    return entities


# ---------------------------
# Example usage
# ---------------------------
if __name__ == "__main__":
    sample_text = """Martin O'Neil checked into a hotel in Cardiff. Email: martin.oneil@travel-mock.net
    IP: 81.22.144.19. Phone: +44 7811 220099. Card: 4485-9901-6622-3300. Date: 03/01/2024. Time: 06:12.
    Website: https://www.staybooking-demo.com"""

    redacted_placeholder = redact_text(sample_text, mode="placeholder")
    redacted_empty = redact_text(sample_text, mode="empty")
    entities = extract_entities_table(sample_text)

    print("Redacted with placeholders:\n", redacted_placeholder)
    print("\nRedacted without placeholders:\n", redacted_empty)
    print("\nEntities Table:")
    for e in entities:
        print(e)
