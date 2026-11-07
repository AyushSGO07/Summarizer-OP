"""
SUMMARIZER OP — Unified Process Runner
Launches all three application services concurrently:
1. Python FastAPI AI Microservice (Port 8000)
2. Node.js Express Backend (Port 5000)
3. React Vite Frontend (Port 3000)
"""

import os
import sys
import subprocess
import time
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def start_services():
    print("=" * 65)
    print("⚡ LAUNCHING SUMMARIZER OP (Full-Stack AI SaaS Application)")
    print("=" * 65)

    processes = []

    try:
        # 1. Start Python FastAPI AI Microservice
        print("\n[1/3] Starting Python FastAPI AI Microservice on port 8000...")
        fastapi_cmd = [sys.executable, "-m", "uvicorn", "ai_service.main:app", "--host", "127.0.0.1", "--port", "8000"]
        p_ai = subprocess.Popen(fastapi_cmd, cwd=ROOT_DIR)
        processes.append(p_ai)

        time.sleep(2)

        # 2. Start Node.js Express Backend
        print("[2/3] Starting Node.js Express Backend on port 5000...")
        backend_dir = os.path.join(ROOT_DIR, "backend")
        p_node = subprocess.Popen("npx tsx src/server.ts", cwd=backend_dir, shell=True)
        processes.append(p_node)

        time.sleep(2)

        # 3. Start React Vite Frontend
        print("[3/3] Starting React Vite Frontend on port 3000...")
        frontend_dir = os.path.join(ROOT_DIR, "frontend")
        p_frontend = subprocess.Popen("npx vite --port 3000 --host 127.0.0.1", cwd=frontend_dir, shell=True)
        processes.append(p_frontend)

        print("\n" + "=" * 65)
        print("✅ ALL SERVICES OPERATIONAL!")
        print("🌐 Open Web App:    http://localhost:3000")
        print("🔗 Node.js API:     http://localhost:5000/api")
        print("🤖 Python AI API:   http://localhost:8000/docs")
        print("=" * 65)
        print("Press Ctrl+C to terminate all services.\n")

        # Keep running
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down SUMMARIZER OP services...")
        for p in processes:
            p.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_services()
