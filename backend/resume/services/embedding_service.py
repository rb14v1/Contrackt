from sentence_transformers import SentenceTransformer
import os
import re
from typing import Dict

# Initialize the model once when the file is imported
model = SentenceTransformer('all-MiniLM-L6-v2') 

def get_text_embedding(text):
    """
    Converts text into vector embeddings using a pre-loaded model.
    """
    embedding = model.encode(text)
    return embedding.tolist()