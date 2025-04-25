from flask import Flask

app = Flask(__name__)

from .Blockchain import Blockchain
from .Block import Block

blockchain = Blockchain()
peers = []

from . import views