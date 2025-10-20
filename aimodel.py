from flask import Flask, request, jsonify
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.document_loaders import WebBaseLoader
from dotenv import load_dotenv
from flask_cors import CORS
import os
import re

# -------------------
# Flask app
# -------------------
app = Flask(__name__)
CORS(app)
load_dotenv()

# -------------------
# Chat model
# -------------------
model = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.environ.get("GROQ_API_KEY"),
)

# -------------------
# Output Parser
# -------------------
output_parser = JsonOutputParser()
format_instructions = output_parser.get_format_instructions()

# -------------------
# Prompt Template
# -------------------
prompt = PromptTemplate(
    template=f"""
You are a financial research assistant. Analyze the following company and return STRICT JSON output.

The JSON must have EXACTLY these keys:
- company_summary (string)
- key_financials (array of strings)
- growth_trends (array of strings)
- strengths (array of strings)
- risks (array of strings)
- recommendation (BUY, HOLD, or SELL)
- quick_summary (string)

⚠️ Rules:
- Do not add extra fields.
- Do not capitalize keys.
- Do not nest objects.

{format_instructions}

Company Analysis Text:
{{text}}
""",
    input_variables=["text"],
    validate_template=True,
)

# -------------------
# Route
# -------------------
@app.route("/analyze", methods=["POST"])
def analyze_url():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        # Load website content
        loader = WebBaseLoader(url)
        docs = loader.load()
        if not docs or not docs[0].page_content:
            return jsonify({"error": "Failed to fetch content from the URL"}), 400

        raw_text = docs[0].page_content
        clean_text = re.sub(r"\s+", " ", raw_text).strip()
        print(f"Fetched content length: {len(clean_text)} characters")

        # Run the chain
        chain = prompt | model | output_parser
        response = chain.invoke({"text": clean_text})
        print("Parsed JSON response:", response)

        return jsonify(response)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

# -------------------
# Run App
# -------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
