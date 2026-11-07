"""
Premium Modern AI SaaS Dark Theme Styles
Inspired by Linear, Perplexity, and ChatGPT.
Features: Deep charcoal background, purple & indigo accents, glassmorphic cards, sleek typography.
"""

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

/* Global Font & Resets */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #F1F5F9;
}

/* Background canvas */
.stApp {
    background: radial-gradient(circle at 15% 10%, rgba(124, 58, 237, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 85% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 45%),
                #090D16;
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    background-color: #0D121F !important;
    border-right: 1px solid rgba(255, 255, 255, 0.07);
}

[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
    color: #94A3B8;
}

/* Glassmorphic cards */
.glass-card {
    background: rgba(18, 24, 38, 0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-card:hover {
    border-color: rgba(168, 85, 247, 0.38);
    box-shadow: 0 14px 35px -5px rgba(124, 58, 237, 0.2);
    transform: translateY(-2px);
}

/* Interactive feature hero card */
.feature-card {
    background: linear-gradient(145deg, rgba(22, 29, 47, 0.85) 0%, rgba(14, 18, 30, 0.95) 100%);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 16px;
    padding: 1.6rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.3s ease;
}

.feature-card:hover {
    border-color: #8B5CF6;
    box-shadow: 0 12px 30px rgba(124, 58, 237, 0.25);
    transform: translateY(-3px);
}

/* Gradient text */
.gradient-text {
    background: linear-gradient(135deg, #C084FC 0%, #818CF8 50%, #60A5FA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
}

.brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    background: rgba(124, 58, 237, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 9999px;
    color: #C084FC;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
}

/* Status pills */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
}

.status-active {
    background: rgba(16, 185, 129, 0.12);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-purple {
    background: rgba(139, 92, 246, 0.15);
    color: #DDD6FE;
    border: 1px solid rgba(139, 92, 246, 0.35);
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%) !important;
    color: #FFFFFF !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 10px !important;
    padding: 0.55rem 1.4rem !important;
    font-weight: 600 !important;
    font-size: 0.92rem !important;
    letter-spacing: 0.01em !important;
    box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.35) !important;
    transition: all 0.2s ease-in-out !important;
}

.stButton > button:hover {
    background: linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%) !important;
    box-shadow: 0 6px 20px 0 rgba(124, 58, 237, 0.5) !important;
    transform: translateY(-1px) !important;
}

.stButton > button:active {
    transform: translateY(1px) !important;
}

/* Secondary Button (Download/Action) */
.stDownloadButton > button {
    background: rgba(30, 41, 59, 0.8) !important;
    color: #E2E8F0 !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 10px !important;
    font-weight: 500 !important;
}

.stDownloadButton > button:hover {
    background: rgba(51, 65, 85, 0.9) !important;
    border-color: #8B5CF6 !important;
    color: #FFFFFF !important;
}

/* Text Inputs, Textareas, Selectboxes */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stSelectbox > div > div {
    background-color: #121727 !important;
    color: #F8FAFC !important;
    border: 1px solid rgba(139, 92, 246, 0.25) !important;
    border-radius: 10px !important;
    font-size: 0.93rem !important;
}

.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
    border-color: #A855F7 !important;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25) !important;
}

/* Tabs styling */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    background-color: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.stTabs [data-baseweb="tab"] {
    height: 44px;
    background-color: transparent;
    border-radius: 8px 8px 0 0;
    color: #94A3B8;
    font-weight: 500;
    font-size: 0.92rem;
    padding: 0 1.2rem;
}

.stTabs [aria-selected="true"] {
    color: #F8FAFC !important;
    border-bottom: 2px solid #8B5CF6 !important;
    background: rgba(139, 92, 246, 0.08) !important;
}

/* Metric styling */
[data-testid="stMetricValue"] {
    font-size: 1.8rem !important;
    font-weight: 700 !important;
    color: #F1F5F9 !important;
}

[data-testid="stMetricLabel"] {
    color: #94A3B8 !important;
    font-size: 0.82rem !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* Chat messages */
.stChatMessage {
    background-color: rgba(18, 24, 38, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 14px !important;
    padding: 1rem !important;
    margin-bottom: 0.75rem !important;
}

/* Source citation card */
.citation-box {
    background: rgba(15, 20, 32, 0.9);
    border-left: 3px solid #8B5CF6;
    border-radius: 0 8px 8px 0;
    padding: 0.8rem 1rem;
    margin: 0.6rem 0;
    font-size: 0.88rem;
    color: #CBD5E1;
}

/* Navigation items in sidebar */
.nav-header {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748B;
    margin: 1.2rem 0 0.5rem 0;
    font-weight: 700;
}

/* Clean scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: #090D16;
}
::-webkit-scrollbar-thumb {
    background: #1E293B;
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
    background: #334155;
}
</style>
"""

def inject_custom_styles():
    """Returns CSS string for injection into Streamlit."""
    return CUSTOM_CSS
