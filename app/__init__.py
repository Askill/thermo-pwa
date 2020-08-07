
from flask import Flask, Response, json, jsonify, render_template, send_from_directory
import requests
app = Flask(__name__)

thermoRoute = "http://192.168.178.25:5000/"

@app.route('/<path:path>')
def send_js(path):
    return send_from_directory('', path)

@app.route("/")
def root():
    return render_template("index2.html")

@app.route("/stats")
def stats():
    return jsonify(requests.get(thermoRoute).json())


