import json
import operator
from pymongo import MongoClient

# Map string operators to actual Python operator functions
ops = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt
}

client = MongoClient("mongodb://localhost:27017/")  # update with your actual connection string
db = client["scheme_data"]  # replace with your database name
scheme_collection = db["schemes"]   # replace with your collection name

# Function to load schemes from Firestore
def load_schemes():
    """
    schemes_ref = db.collection("scheme")
    docs = schemes_ref.stream()
    return [doc.to_dict() for doc in docs]
    """
    return list(scheme_collection.find({}, {"_id": 0}))  # Exclude _id if not needed

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
        rules = scheme.get("eligibility", [])
        if all(evaluate_rule(user_data, rule) for rule in rules):
            eligible.append({
                "name": scheme.get("name")
            })
    return eligible
