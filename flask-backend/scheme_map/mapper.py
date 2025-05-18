import json
import operator
from pymongo import MongoClient

ops = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt
}

client = MongoClient("mongodb://localhost:27017/")
db = client["scheme_data"]
scheme_collection = db["schemes"]

def load_schemes():
    return list(scheme_collection.find({}, {"_id": 0}))

def evaluate_rule(user_data, rule):
    attr = rule["attribute"]
    user_value = user_data.get(attr)
    if user_value is None:
        print(f"Missing value for attribute: {attr}")
        return None
    
    expected_value = rule["value"]
    operator_func = ops[rule["operator"]]
    
    try:
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

def find_eligible_schemes(user_data, schemes):
    eligible = []
    print(f"Received user data: {user_data}")
    
    for scheme in schemes:
        rules = scheme.get("eligibility", [])
        evaluated_rules = [evaluate_rule(user_data, rule) for rule in rules]
        valid_rules = [result for result in evaluated_rules if result is not None]
        
        if valid_rules and all(valid_rules):
            eligible.append({
                "name": scheme.get("name"),
                "description": scheme.get("description", "")
            })
    
    return eligible
