import time
from collections import Counter
from typing import Dict, List, Any
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

# Mapping spaCy labels to standard presentation categories
LABEL_MAP = {
    "PERSON": "PERSON",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION (GPE)",
    "LOC": "LOCATION",
    "DATE": "DATE",
    "TIME": "TIME",
    "MONEY": "MONEY",
    "PERCENT": "PERCENT",
    "PRODUCT": "PRODUCT",
    "EVENT": "EVENT",
    "FAC": "FACILITY",
    "LAW": "LAW / POLICY",
    "NORP": "NATIONALITY / GROUP",
    "WORK_OF_ART": "CREATIVE WORK",
    "CARDINAL": "NUMERICAL",
    "ORDINAL": "ORDINAL",
    "QUANTITY": "QUANTITY"
}

class NamedEntityRecognizer:
    """
    Extracts named entities using spaCy and provides contextual evidence,
    entity frequencies, and distribution statistics.
    """

    @classmethod
    def extract_entities(cls, text: str, sentences: List[str] | None = None) -> Dict[str, Any]:
        start_time = time.perf_counter()
        doc = nlp(text)
        
        entities_raw = []
        entity_freq = Counter()
        entity_contexts: Dict[str, str] = {}
        entity_labels: Dict[str, str] = {}

        # If sentences not supplied, use doc.sents
        if not sentences:
            sentences = [s.text.strip() for s in doc.sents]

        for ent in doc.ents:
            clean_text = ent.text.strip().replace("\n", " ")
            label = ent.label_
            
            # Skip single punctuation or trivial short numbers
            if len(clean_text) < 2 and label in ("CARDINAL", "ORDINAL"):
                continue
                
            standard_label = LABEL_MAP.get(label, label)
            key = f"{clean_text}::{standard_label}"
            
            entity_freq[key] += 1
            entity_labels[key] = standard_label
            
            # Find supporting sentence
            if key not in entity_contexts:
                sent_text = ent.sent.text.strip() if hasattr(ent, "sent") and ent.sent else ""
                if not sent_text and sentences:
                    for s in sentences:
                        if clean_text in s:
                            sent_text = s
                            break
                entity_contexts[key] = sent_text

        # Build structured list
        entities_list = []
        distribution = Counter()

        for key, freq in entity_freq.most_common():
            name, label = key.split("::", 1)
            distribution[label] += freq
            entities_list.append({
                "text": name,
                "label": label,
                "frequency": freq,
                "context_sentence": entity_contexts.get(key, "")
            })

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "entities": entities_list,
            "distribution": dict(distribution),
            "total_entities_count": len(entities_list),
            "execution_time_ms": round(elapsed_ms, 2)
        }
