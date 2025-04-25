import os
import json
from flask import request, render_template, redirect, send_file, jsonify
from werkzeug.utils import secure_filename
from . import app, blockchain
from timeit import default_timer as timer

# File upload config
UPLOAD_FOLDER = os.path.join("app", "uploads")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Store upload file paths for downloads
files = {}

# Blockchain routes (from peer.py)

@app.route("/new_transaction", methods=["POST"])
def new_transaction():
    file_data = request.get_json()
    required_fields = ["user", "v_file", "file_data", "file_size"]
    for field in required_fields:
        if not file_data.get(field):
            return "Transaction does not have valid fields!", 404
    blockchain.add_pending(file_data)
    return "Success", 201

@app.route("/mine", methods=["GET"])
def mine_unconfirmed_transactions():
    result = blockchain.mine()
    if result:
        return f"Block #{result} mined successfully."
    return "No pending transactions to mine."

@app.route("/chain", methods=["GET"])
def get_chain():
    chain = [block.__dict__ for block in blockchain.chain]
    return json.dumps({"length": len(chain), "chain": chain})

@app.route("/pending_tx")
def get_pending_tx():
    return json.dumps(blockchain.pending)

@app.route("/add_block", methods=["POST"])
def validate_and_add_block():
    block_data = request.get_json()
    from Block import Block
    block = Block(block_data["index"], block_data["transactions"], block_data["prev_hash"])
    hashl = block_data["hash"]
    added = blockchain.add_block(block, hashl)
    if not added:
        return "The Block was discarded by the node.", 400
    return "The block was added to the chain.", 201

# Web UI routes (modified original)

@app.route("/")
def index():
    chain = [tx for block in blockchain.chain for tx in block.transactions]
    chain = sorted(chain, key=lambda x: x.get("user", ""), reverse=True)
    return render_template("index.html", title="FileStorage", subtitle="A Decentralized Network for File Storage/Sharing", node_address="/chain", request_tx=chain)

@app.route("/submit/<string:filename>", methods=["GET"])
def download_file(filename):
    path = files.get(filename)
    if path:
        return send_file(path, as_attachment=True)
    return "File not found", 404

# ✅ The key upload route used by your React frontend
@app.route("/user/upload", methods=["POST"])
def upload_files():
    username = request.form.get("name")
    uploaded_files = request.files.getlist("documents")

    if not username or not uploaded_files:
        return {"message": "Missing username or files"}, 400

    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(username))
    os.makedirs(user_folder, exist_ok=True)

    for file in uploaded_files:
        filepath = os.path.join(user_folder, secure_filename(file.filename))
        file.save(filepath)

        files[file.filename] = filepath  # store for downloading
        file_size = os.stat(filepath).st_size
        with open(filepath, "rb") as f:
            file_data = f.read()

        post_object = {
            "user": username,
            "v_file": file.filename,
            "file_data": str(file_data),
            "file_size": file_size
        }

        # Direct blockchain call (no HTTP)
        blockchain.add_pending(post_object)

    # Optionally mine immediately after upload
    blockchain.mine()

    return {"message": f"{len(uploaded_files)} files uploaded and mined successfully."}, 201
