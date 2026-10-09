import time
from typing import Dict, List, Any, Set, Tuple
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

class RelationExtractor:
    """
    Extracts binary relationships (Subject, Predicate, Object) between entities
    by analyzing syntactic dependency trees and verb-object argument structures.
    """

    @classmethod
    def extract_relations(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        doc = nlp(text)
        
        relations: List[Dict[str, Any]] = []
        seen_triples: Set[Tuple[str, str, str]] = set()

        for sent in doc.sents:
            sent_text = sent.text.strip()
            if len(sent_text) < 15:
                continue

            # Identify verbs in the sentence
            for token in sent:
                if token.pos_ != "VERB" or token.is_stop:
                    continue

                # Look for subject
                subjects = []
                for child in token.children:
                    if child.dep_ in ("nsubj", "nsubjpass", "csubj"):
                        subjects.append(cls._get_entity_or_phrase(child, sent.ents))

                # Look for direct object or prepositional object
                objects = []
                predicate_text = token.lemma_

                for child in token.children:
                    if child.dep_ in ("dobj", "attr", "dative", "oprd"):
                        objects.append(cls._get_entity_or_phrase(child, sent.ents))
                    elif child.dep_ == "prep":
                        # Prepositional modifier: e.g. "invested in X", "partnered with Y"
                        prep_lemma = child.lemma_
                        for pchild in child.children:
                            if pchild.dep_ in ("pobj", "pcomp"):
                                objects.append(cls._get_entity_or_phrase(pchild, sent.ents))
                                predicate_text = f"{token.lemma_} {prep_lemma}"

                # Also handle passive relations: "was acquired by Company X"
                for child in token.children:
                    if child.dep_ == "agent":
                        for pchild in child.children:
                            if pchild.dep_ == "pobj":
                                # Reverse subject/object for passive
                                agent_subj = cls._get_entity_or_phrase(pchild, sent.ents)
                                for orig_subj in subjects:
                                    triple_key = (agent_subj.lower(), predicate_text.lower(), orig_subj.lower())
                                    if triple_key not in seen_triples and agent_subj != orig_subj:
                                        seen_triples.add(triple_key)
                                        relations.append({
                                            "subject": agent_subj,
                                            "predicate": predicate_text,
                                            "object": orig_subj,
                                            "evidence_sentence": sent_text,
                                            "extraction_method": "Passive Dependency Tree Inversion",
                                            "confidence": 0.88
                                        })

                # Pair active subjects and objects
                for subj in subjects:
                    for obj in objects:
                        if not subj or not obj or subj.lower() == obj.lower():
                            continue
                        if len(subj) < 2 or len(obj) < 2 or len(subj) > 60 or len(obj) > 60:
                            continue

                        triple_key = (subj.lower(), predicate_text.lower(), obj.lower())
                        if triple_key not in seen_triples:
                            seen_triples.add(triple_key)
                            relations.append({
                                "subject": subj,
                                "predicate": predicate_text,
                                "object": obj,
                                "evidence_sentence": sent_text,
                                "extraction_method": "Syntactic Dependency Tree & Argument Structure",
                                "confidence": 0.85
                            })

        # Filter and rank relations
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "relationships": relations,
            "total_relations": len(relations),
            "execution_time_ms": round(elapsed_ms, 2)
        }

    @staticmethod
    def _get_entity_or_phrase(token, ents) -> str:
        # Check if token falls inside a named entity
        for ent in ents:
            if ent.start <= token.i < ent.end:
                return ent.text.strip()

        # Else expand noun chunk
        words = []
        for t in token.subtree:
            if not t.is_punct and t.dep_ not in ("relcl", "advcl", "punct"):
                words.append(t.text)
        phrase = " ".join(words).strip()
        return phrase if 0 < len(phrase) < 50 else token.text.strip()
