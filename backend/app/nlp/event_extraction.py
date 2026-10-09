import re
import time
from typing import Dict, List, Any, Optional
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

EVENT_PATTERNS = [
    {
        "type": "Acquisition",
        "verbs": ["acquire", "buy", "purchase", "take over", "absorb"],
        "nouns": ["acquisition", "takeover", "buyout"],
        "default_action": "acquired"
    },
    {
        "type": "Investment & Funding",
        "verbs": ["invest", "raise", "secure", "infuse", "fund", "backed"],
        "nouns": ["investment", "funding", "round", "infusion", "capital"],
        "default_action": "invested in / raised funding"
    },
    {
        "type": "Product Launch",
        "verbs": ["launch", "unveil", "introduce", "release", "roll out", "debut"],
        "nouns": ["launch", "debut", "release", "unveiling"],
        "default_action": "launched"
    },
    {
        "type": "Executive Appointment",
        "verbs": ["appoint", "name", "hire", "promote", "elect", "designate"],
        "nouns": ["appointment", "naming"],
        "default_action": "appointed"
    },
    {
        "type": "Executive Resignation",
        "verbs": ["resign", "step down", "depart", "quit", "leave"],
        "nouns": ["resignation", "departure"],
        "default_action": "resigned from"
    },
    {
        "type": "Policy & Regulation",
        "verbs": ["approve", "enact", "pass", "ban", "propose", "regulate", "order", "impose"],
        "nouns": ["bill", "policy", "regulation", "law", "sanctions", "directive"],
        "default_action": "enacted / announced policy"
    },
    {
        "type": "Agreement & Partnership",
        "verbs": ["partner", "collaborate", "sign", "join hands", "team up", "agree"],
        "nouns": ["partnership", "agreement", "deal", "pact", "mou", "alliance"],
        "default_action": "partnered with"
    },
    {
        "type": "Financial Result",
        "verbs": ["report", "post", "record", "generate", "deliver"],
        "nouns": ["revenue", "profit", "earnings", "quarterly results", "loss"],
        "default_action": "reported financial results"
    },
    {
        "type": "Scientific Discovery",
        "verbs": ["discover", "find", "develop", "create", "synthesize", "observe"],
        "nouns": ["discovery", "breakthrough", "study", "finding"],
        "default_action": "discovered"
    }
]

class EventExtractor:
    """
    Extracts structured events using dependency parsing, predicate-argument
    frames, named entities, and linguistic event triggers.
    """

    @classmethod
    def extract_events(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        doc = nlp(text)
        
        extracted_events = []
        seen_sentences = set()

        for sent in doc.sents:
            sent_text = sent.text.strip()
            if len(sent_text) < 15 or sent_text in seen_sentences:
                continue

            # Extract entities in this specific sentence
            sent_ents = {ent.label_: ent.text for ent in sent.ents}
            org_ents = [ent.text for ent in sent.ents if ent.label_ in ("ORG", "PERSON")]
            money_ents = [ent.text for ent in sent.ents if ent.label_ in ("MONEY", "CARDINAL", "PERCENT")]
            date_ents = [ent.text for ent in sent.ents if ent.label_ in ("DATE", "TIME")]
            gpe_ents = [ent.text for ent in sent.ents if ent.label_ in ("GPE", "LOC", "FAC")]

            # Look for money value pattern with regex fallback
            money_val = money_ents[0] if money_ents else None
            if not money_val:
                m_match = re.search(r"(\$|€|£|₹|Rs\.?)\s?[\d\.,]+\s?(billion|million|trillion|crore|lakh|B|M|k)?", sent_text, re.I)
                if m_match:
                    money_val = m_match.group(0)

            # Analyze dependency tokens and verbs
            for token in sent:
                if token.pos_ not in ("VERB", "NOUN"):
                    continue

                lemma = token.lemma_.lower()

                for pat in EVENT_PATTERNS:
                    matched = False
                    if token.pos_ == "VERB" and lemma in pat["verbs"]:
                        matched = True
                    elif token.pos_ == "NOUN" and lemma in pat["nouns"]:
                        matched = True

                    if matched:
                        # Extract subject and object using dependency tree
                        subj = None
                        obj = None

                        if token.pos_ == "VERB":
                            # Look for nsubj, nsubjpass, agent
                            for child in token.children:
                                if child.dep_ in ("nsubj", "nsubjpass", "agent"):
                                    subj = cls._expand_noun_chunk(child)
                                elif child.dep_ in ("dobj", "attr", "pobj", "dative", "oprd"):
                                    obj = cls._expand_noun_chunk(child)
                                elif child.dep_ == "prep":
                                    for pchild in child.children:
                                        if pchild.dep_ == "pobj" and not obj:
                                            obj = cls._expand_noun_chunk(pchild)

                        # Fallback to nearest entities if dep parse was incomplete
                        if not subj and len(org_ents) > 0:
                            subj = org_ents[0]
                        if not obj and len(org_ents) > 1:
                            obj = org_ents[1]

                        # Clean values
                        actor = subj or (org_ents[0] if org_ents else None)
                        target = obj or (org_ents[1] if len(org_ents) > 1 else None)
                        action_desc = token.text.lower() if token.pos_ == "VERB" else pat["default_action"]
                        date_val = date_ents[0] if date_ents else None
                        loc_val = gpe_ents[0] if gpe_ents else None

                        # Only add if we have at least an actor or target
                        if actor or target or money_val:
                            seen_sentences.add(sent_text)
                            extracted_events.append({
                                "event_type": pat["type"],
                                "actor_acquirer": actor,
                                "target_object": target,
                                "action": action_desc,
                                "event_date": date_val,
                                "location": loc_val,
                                "financial_value": money_val,
                                "supporting_sentence": sent_text,
                                "confidence": 0.88 if (actor and target) else 0.75
                            })
                            break
                if sent_text in seen_sentences:
                    break

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "events": extracted_events,
            "total_events": len(extracted_events),
            "execution_time_ms": round(elapsed_ms, 2)
        }

    @staticmethod
    def _expand_noun_chunk(token) -> str:
        """Expands token into its compound or subtree phrase."""
        phrase = []
        for t in token.subtree:
            if not t.is_punct and t.dep_ not in ("relcl", "advcl"):
                phrase.append(t.text)
        result = " ".join(phrase).strip()
        return result if 0 < len(result) < 60 else token.text
