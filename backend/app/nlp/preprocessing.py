import re
import time
from typing import Dict, List, Any
import nltk
from nltk.corpus import stopwords
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")

try:
    stop_words_set = set(stopwords.words("english"))
except Exception:
    stop_words_set = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by"}

class TextPreprocessor:
    """
    NLP Preprocessing stage:
    - Cleans HTML and excessive whitespace
    - Sentence segmentation
    - Tokenization
    - Lemmatization
    - POS Tagging
    - Stopword filtering
    """

    @classmethod
    def clean_text(cls, text: str) -> str:
        if not text:
            return ""
        # Strip remaining HTML tags
        cleaned = re.sub(r"<[^>]+>", " ", text)
        # Normalize whitespace while preserving paragraph breaks
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    @classmethod
    def process(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        cleaned_text = cls.clean_text(text)
        
        doc = nlp(cleaned_text)
        
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        
        sample_tokens = []
        token_count = 0
        
        for token in doc:
            if not token.is_space:
                token_count += 1
                if len(sample_tokens) < 100:  # Sample for UI inspection
                    sample_tokens.append({
                        "text": token.text,
                        "lemma": token.lemma_,
                        "pos": token.pos_,
                        "tag": token.tag_,
                        "is_stop": token.is_stop or token.lower_ in stop_words_set
                    })
                    
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "original_char_count": len(text),
            "cleaned_char_count": len(cleaned_text),
            "sentence_count": len(sentences),
            "token_count": token_count,
            "sentences": sentences,
            "cleaned_text": cleaned_text,
            "sample_tokens": sample_tokens,
            "sample_sentences": sentences[:10],
            "execution_time_ms": round(elapsed_ms, 2)
        }
