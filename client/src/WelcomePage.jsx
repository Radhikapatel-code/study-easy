import './index.css';
import { Link } from 'react-router-dom';
import { Terminal, ArrowRight, Sparkles } from 'lucide-react';
import Header from './components/Header';

function WelcomePage() {
  return (
    // MAIN CONTAINER with Pixel Font
    <div 
      className="min-h-screen bg-[#050505] flex flex-col p-6 relative overflow-hidden font-pixel text-white"
    >
      
      {/* --- STYLES FOR PIXEL FONT --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        .font-pixel { font-family: 'VT323', monospace; }
        
        /* CRT Scanline Effect (Optional visual flair) */
        .scanline {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.2) 50%,
            rgba(0,0,0,0.2)
          );
          background-size: 100% 4px;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 50;
        }

        /* Typing Cursor Animation */
        .cursor-blink {
          display: inline-block;
          width: 10px;
          height: 1em;
          background-color: #22d3ee; /* Cyan */
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* --- BACKGROUND DECORATION --- */}
      <div className="absolute inset-0 scanline"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <Header />

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-1 flex-col lg:flex-row items-center justify-center mt-10 max-w-6xl mx-auto gap-12 relative z-10">
        
        {/* Left: Typing Animation / Tagline */}
        <div className="flex-1 text-center lg:text-left">
           <div className="inline-block bg-black/40 p-6 border-l-4 border-cyan-500 backdrop-blur-sm">
             <div className="flex items-center gap-2 text-cyan-500 mb-2">
               <Sparkles size={18} />
               <span className="text-sm tracking-widest">SYSTEM INITIALIZING...</span>
             </div>
             <p className="text-4xl md:text-5xl leading-tight text-white uppercase shadow-black drop-shadow-lg">
               MISSION READY:<br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">PLAN. STUDY. WIN.</span><br/>
               LET'S PLAN YOUR SESSION<span className="cursor-blink"></span>
             </p>
           </div>
        </div>

        {/* Right: Login/Register Card */}
        <div className="w-full max-w-md">
          <div className="bg-black/60 border-2 border-cyan-500/20 backdrop-blur-md p-8 relative group">
            
            {/* Decorative Corner Bits */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

            {/* User Icon Area */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-purple-500 blur-lg opacity-18 animate-pulse"></div>
              <div className="w-full h-full bg-zinc-900 border-2 border-dashed border-zinc-600 rounded-full flex items-center justify-center overflow-hidden relative z-10">
                 <img src="download (1).jpg" alt="User" className="w-full h-full object-cover" />
               </div>
            </div>

            <div className="space-y-6 text-center">
              
              {/* Login Block */}
              <div>
                <p className="text-xl text-cyan-200 mb-2 tracking-widest text-left"> IDENTIFIED USER?</p>
                <Link to="/login">
                  <button className="w-full bg-gradient-to-r from-purple-700/30 to-cyan-700/20 hover:from-purple-600 hover:to-cyan-500 border border-cyan-500 text-white px-6 py-3 text-2xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,211,238,0.12)] flex items-center justify-center gap-2 group-btn">
                    <span>LOGIN_PROTOCOL</span>
                    <ArrowRight size={20} className="group-btn-hover:translate-x-1 transition-transform"/>
                  </button>
                </Link>
              </div>

              {/* Register Block */}
              <div>
                <p className="text-xl text-cyan-200 mb-2 tracking-widest text-left"> NEW RECRUIT?</p>
                <Link to="/register">
                  <button className="w-full bg-cyan-900/20 hover:bg-cyan-600 border border-cyan-500 text-white px-6 py-3 text-2xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,211,238,0.12)]">
                    INITIALIZE_REGISTRATION
                  </button>
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default WelcomePage;