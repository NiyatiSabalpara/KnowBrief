import re
import time
from collections import defaultdict
from typing import Dict, List, Any, Optional
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

PRONOUN_MAP = {
    # Singular male
    "he": "PERSON_MASC",
    "him": "PERSON_MASC",
    "his": "PERSON_MASC",
    "himself": "PERSON_MASC",
    # Singular female
    "she": "PERSON_FEM",
    "her": "PERSON_FEM",
    "hers": "PERSON_FEM",
    "herself": "PERSON_FEM",
    # Neuter singular
    "it": "OBJECT_OR_ORG",
    "its": "OBJECT_OR_ORG",
    "itself": "OBJECT_OR_ORG",
    # Plural / Collective
    "they": "PLURAL_OR_ORG",
    "them": "PLURAL_OR_ORG",
    "their": "PLURAL_OR_ORG",
    "theirs": "PLURAL_OR_ORG",
}

DEFINITE_NOMINALS = {
    "the company": "ORGANIZATION",
    "the firm": "ORGANIZATION",
    "the startup": "ORGANIZATION",
    "the enterprise": "ORGANIZATION",
    "the corporation": "ORGANIZATION",
    "the giant": "ORGANIZATION",
    "the maker": "ORGANIZATION",
    "the platform": "PRODUCT",
    "the service": "PRODUCT",
    "the tool": "PRODUCT",
    "the president": "PERSON",
    "the prime minister": "PERSON",
    "the minister": "PERSON",
    "the leader": "PERSON",
    "the official": "PERSON",
    "the executive": "PERSON",
    "the ceo": "PERSON",
    "the country": "GPE",
    "the nation": "GPE",
    "the government": "ORGANIZATION",
}

class CoreferenceResolver:
    """
    Implements rule-based and linguistic heuristic Coreference Resolution
    connecting anaphoric pronouns and definite nominals to their antecedent entities.
    """

    @classmethod
    def resolve(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        doc = nlp(text)
        
        entities_by_sent = []
        recent_orgs = []
        recent_persons = []
        recent_gpes = []
        recent_products = []

        chains = defaultdict(lambda: {"entity": "", "label": "", "mentions": set(), "examples": []})

        for s_idx, sent in enumerate(doc.sents):
            sent_text = sent.text.strip()
            
            # Record named entities in this sentence
            for ent in sent.ents:
                ent_clean = ent.text.strip()
                label = ent.label_
                if label == "ORG":
                    recent_orgs.append((ent_clean, s_idx))
                    chains[ent_clean]["entity"] = ent_clean
                    chains[ent_clean]["label"] = "ORGANIZATION"
                    chains[ent_clean]["mentions"].add(ent_clean)
                elif label == "PERSON":
                    recent_persons.append((ent_clean, s_idx))
                    chains[ent_clean]["entity"] = ent_clean
                    chains[ent_clean]["label"] = "PERSON"
                    chains[ent_clean]["mentions"].add(ent_clean)
                elif label in ("GPE", "LOC"):
                    recent_gpes.append((ent_clean, s_idx))
                    chains[ent_clean]["entity"] = ent_clean
                    chains[ent_clean]["label"] = "LOCATION"
                    chains[ent_clean]["mentions"].add(ent_clean)
                elif label == "PRODUCT":
                    recent_products.append((ent_clean, s_idx))
                    chains[ent_clean]["entity"] = ent_clean
                    chains[ent_clean]["label"] = "PRODUCT"
                    chains[ent_clean]["mentions"].add(ent_clean)

            # Check for definite nominals in sentence
            sent_lower = sent_text.lower()
            for nominal, target_type in DEFINITE_NOMINALS.items():
                if nominal in sent_lower:
                    antecedent = None
                    if target_type == "ORGANIZATION" and recent_orgs:
                        antecedent = recent_orgs[-1][0]
                    elif target_type == "PERSON" and recent_persons:
                        antecedent = recent_persons[-1][0]
                    elif target_type == "GPE" and recent_gpes:
                        antecedent = recent_gpes[-1][0]
                    elif target_type == "PRODUCT" and recent_products:
                        antecedent = recent_products[-1][0]

                    if antecedent and antecedent.lower() != nominal:
                        chains[antecedent]["mentions"].add(nominal)
                        resolved_sent = re.sub(re.escape(nominal), f"[{antecedent}]", sent_text, flags=re.I)
                        chains[antecedent]["examples"].append({
                            "original_sentence": sent_text,
                            "resolved_sentence": resolved_sent,
                            "mention": nominal
                        })

            # Check pronouns in token stream
            for token in sent:
                word_lower = token.text.lower()
                if word_lower in PRONOUN_MAP and token.pos_ == "PRON":
                    pron_type = PRONOUN_MAP[word_lower]
                    antecedent = None

                    if "PERSON" in pron_type and recent_persons:
                        antecedent = recent_persons[-1][0]
                    elif "ORG" in pron_type and recent_orgs:
                        antecedent = recent_orgs[-1][0]
                    elif "OBJECT" in pron_type and (recent_products or recent_orgs):
                        antecedent = recent_products[-1][0] if recent_products else recent_orgs[-1][0]

                    if antecedent and antecedent.lower() != word_lower:
                        chains[antecedent]["mentions"].add(token.text)
                        if len(chains[antecedent]["examples"]) < 3:
                            # Replace pronoun in sentence for illustration
                            pattern = r"\b" + re.escape(token.text) + r"\b"
                            resolved_sent = re.sub(pattern, f"[{antecedent}]", sent_text, count=1)
                            chains[antecedent]["examples"].append({
                                "original_sentence": sent_text,
                                "resolved_sentence": resolved_sent,
                                "mention": token.text
                            })

        # Format chains
        formatted_chains = []
        for key, data in chains.items():
            if len(data["mentions"]) > 1 or len(data["examples"]) > 0:
                formatted_chains.append({
                    "representative_entity": data["entity"] or key,
                    "entity_type": data["label"],
                    "mentions": list(data["mentions"]),
                    "resolved_sentence_examples": data["examples"][:3]
                })

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "chains": formatted_chains,
            "total_chains": len(formatted_chains),
            "method": "Rule-Based & Entity-Grounded Anaphora Resolution",
            "execution_time_ms": round(elapsed_ms, 2)
        }
