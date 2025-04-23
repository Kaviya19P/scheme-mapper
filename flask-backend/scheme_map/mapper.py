import json
import operator
import firebase_admin
from firebase_admin import credentials, firestore

# Map string operators to actual Python operator functions
ops = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt
}

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("scheme_map/firebase_adminsdk.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Function to load schemes from Firestore
def load_schemes():
    schemes_ref = db.collection("scheme")
    docs = schemes_ref.stream()
    return [doc.to_dict() for doc in docs]

# Evaluate each rule
def evaluate_rule(user_data, rule):
    attr = rule["attribute"]
    user_value = user_data.get(attr)
    expected_value = rule["value"]
    operator_func = ops[rule["operator"]]

    if user_value is None:
        print(f"Missing value for attribute: {attr}")
        return False

    try:
        # Handle number comparison
        if isinstance(expected_value, (int, float)):
            user_value = float(user_value)
        else:
            user_value = str(user_value).strip().lower()
            expected_value = str(expected_value).strip().lower()

        result = operator_func(user_value, expected_value)
        print(f"Evaluating: {attr} -> {user_value} {rule['operator']} {expected_value} => {result}")
        return result

    except Exception as e:
        print(f"Error evaluating rule {rule}: {e}")
        return False

# Main eligibility checker
def find_eligible_schemes(user_data, schemes):
    eligible = []
    for scheme in schemes:
        if all(evaluate_rule(user_data, rule) for rule in scheme["eligibility"]):
            eligible.append({
                "name": scheme.get("name")
            })
    return eligible
