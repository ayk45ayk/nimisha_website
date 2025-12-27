import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Brain, BookOpen, Mail, Phone, MapPin, Menu, X, Award, Calendar, 
  User, Users, Smile, ArrowRight, ExternalLink, CheckCircle, Shield, FileText, 
  Clock, CreditCard, Star, MessageSquare, ChevronLeft, ChevronRight, Send, 
  Trash2, Lock, AlertTriangle, Loader, Info, Globe, Cookie, HelpCircle, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, where, getDocs, setDoc, updateDoc, limit 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import isEmail from 'validator/lib/isEmail';
import { getPaymentConfig, getPaymentConfigAsync, loadScript, processPayment as processDemoPayment } from './utils/payment.js';
import TrackingManager from './components/TrackingManager.jsx';
import { trackEvent, logError } from './lib/tracking.js';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { 
    console.error("Uncaught error:", error, errorInfo);
    logError(error, { component: 'ErrorBoundary', info: errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">Refresh Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Modal Component ---
const Modal = ({ title, children, icon: Icon, onClose, className = "" }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
    <div className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in ${className}`}>
      <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-2 rounded-lg"><Icon className="w-6 h-6 text-teal-600" /></div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-stone-100 p-2 rounded-full transition-colors"><X size={24} /></button>
      </div>
      <div className="p-6 md:p-8 text-slate-600 leading-relaxed space-y-4">{children}</div>
    </div>
  </div>
);

// --- Sub-Components (Defined Outside) ---

const HeroSection = ({ openBookingModal, handleNavClick, heroContent }) => (
  <section id="home" className="pt-32 pb-20 px-6 bg-stone-50 animate-fade-in min-h-screen flex flex-col justify-center">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl font-bold text-slate-900">Compassionate Care for <span className="text-teal-600">Mental Wellness</span></h1>
          <p className="text-lg text-slate-600">Dedicated to empowering children, adolescents, and adults through evidence-based therapy.</p>
          <div className="flex gap-4">
            <button onClick={openBookingModal} className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg">Book Appointment</button>
            <button onClick={() => handleNavClick('services')} className="bg-white border text-slate-700 px-8 py-3 rounded-full font-semibold">View Services</button>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl rotate-2">
            <img src={heroContent.image} alt="Wellness" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-end p-8"><p className="text-white text-lg italic">"{heroContent.text}"</p></div>
          </div>
        </div>
      </div>
  </section>
);

const ServicesSection = () => {
  const services = [
    { title: "Child & Adolescent Therapy", Icon: Smile, description: "Specialized support for ADHD, Autism, and behavioral challenges.", tags: ["ADHD", "ASD"] },
    { title: "Student & Exam Stress", Icon: BookOpen, description: "Expert guidance for exam anxiety and academic pressure.", tags: ["Anxiety", "Focus"] },
    { title: "Individual Counselling", Icon: User, description: "Therapy for depression, trauma, and relationships.", tags: ["Depression", "Trauma"] },
    { title: "Parenting Guidance", Icon: Users, description: "Strategies to support children's mental health.", tags: ["Family", "Psychoeducation"] }
  ];

  return (
    <section id="services" className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-slate-800">My Services</h2><div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full mt-4"></div></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <div key={idx} className="bg-stone-50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-stone-100 group">
                <div className="bg-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors duration-300 shadow-sm">
                  <service.Icon className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{service.description}</p>
                <div className="flex flex-wrap gap-2">{service.tags.map((tag, tIdx) => (<span key={tIdx} className="text-xs font-medium bg-white border border-stone-200 text-stone-600 px-2 py-1 rounded-md">{tag}</span>))}</div>
              </div>
            ))}
          </div>
        </div>
    </section>
  );
};

const TestimonialsSection = ({ reviews, isAdmin, initiateDelete, hasBooked, handlePostReview, newReview, setNewReview, reviewStatus, openVerifyModal }) => (
  <section id="testimonials" className="py-20 px-6 bg-teal-900 text-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Stories of Growth</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.map(r => (
              <div key={r.id} className="bg-white/10 p-6 rounded-xl border border-white/10 relative group">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center text-sm font-bold">{r.name ? r.name.charAt(0) : 'A'}</div>
                    <span className="font-bold">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => (<Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "" : "text-white/20"} />))}</div>
                      {isAdmin && <button onClick={(e) => initiateDelete(e, r.id)} className="text-red-300 hover:text-red-100 p-1 transition-colors"><Trash2 size={16} /></button>}
                  </div>
                </div>
                <p className="text-sm opacity-90">"{r.text}"</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8 text-slate-800">
            <h3 className="text-xl font-bold mb-6">Share Your Story</h3>
            
            {hasBooked ? (
              <form onSubmit={handlePostReview} className="space-y-4 animate-fade-in">
                <textarea className="w-full px-4 py-3 border rounded-lg" rows="4" placeholder="Your experience..." value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} required></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    className="px-4 py-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500" 
                    placeholder="Name" 
                    value={newReview.name} 
                    onChange={e => setNewReview({...newReview, name: e.target.value})} 
                    disabled={newReview.anonymous}
                    required={!newReview.anonymous} 
                  />
                  <select className="px-4 py-2 border rounded-lg" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})}>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="anonymous" 
                        checked={newReview.anonymous} 
                        onChange={(e) => setNewReview({...newReview, anonymous: e.target.checked, name: e.target.checked ? "" : newReview.name})} 
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300" 
                    />
                    <label htmlFor="anonymous" className="text-sm text-slate-600 select-none cursor-pointer">Post anonymously</label>
                </div>
                <button type="submit" disabled={reviewStatus === 'submitting'} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold">
                  {reviewStatus === 'submitting' ? 'Posting...' : 'Post Review'}
                </button>
                {reviewStatus === 'error' && <p className="text-red-500 text-xs mt-2">Could not post review. Please try again.</p>}
              </form>
            ) : (
              <div className="text-center py-8 bg-stone-50 rounded-xl border border-stone-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-3">
                  <Lock size={20} />
                </div>
                <h4 className="font-bold text-slate-700 mb-2">Verified Customers Only</h4>
                <p className="text-sm text-slate-500 mb-4 px-6">To maintain authenticity, only clients who have completed a booking can share their experience.</p>
                <button onClick={openVerifyModal} className="text-teal-600 font-semibold text-sm hover:underline">Verify your number or book a session</button>
              </div>
            )}
          </div>
        </div>
      </div>
  </section>
);

const ContactSection = ({ handleSendMessage, formStatus }) => (
  <section id="contact" className="py-20 px-6 bg-slate-900 text-white">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div><h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Journey Today</h2><div className="w-20 h-1.5 bg-teal-500 rounded-full mb-6"></div><p className="text-slate-300 text-lg">Taking the first step towards mental wellness is a sign of strength. Reach out to schedule a consultation or for any inquiries.</p></div>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><Phone className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Call Me</h3><a href="tel:+918000401045" className="text-slate-300 hover:text-white transition-colors">+91-8000401045</a></div></div>
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><Mail className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Email Me</h3><a href="mailto:nimishakhandelwal995@gmail.com" className="text-slate-300 hover:text-white transition-colors break-all">nimishakhandelwal995@gmail.com</a></div></div>
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><MapPin className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Location</h3><p className="text-slate-300">142 Royal Bungalow, Sukhliya<br />Indore, MP 42010</p></div></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 text-slate-800 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
            <form className="space-y-4" onSubmit={handleSendMessage}>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label><input type="text" className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" placeholder="John Doe" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label><input type="tel" className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" placeholder="+91 XXXXX XXXXX" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Message</label><textarea rows="4" className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all resize-none" placeholder="How can I help you?" required></textarea></div>
              <button type="submit" disabled={formStatus !== 'idle'} className={`w-full font-bold py-3.5 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${formStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}>
                {formStatus === 'idle' && "Send Message"}
                {formStatus === 'sending' && <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Sending...</>}
                {formStatus === 'success' && <><CheckCircle className="w-5 h-5" />Message Sent!</>}
              </button>
            </form>
          </div>
        </div>
      </div>
  </section>
);

const AboutSection = () => (
  <section id="about" className="py-20 px-6 bg-white">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">About Me</h2>
        <div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          With a strong academic foundation and hands-on experience in clinical and educational settings, I strive to create safe spaces for growth and healing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>
            Hello, I'm <strong className="text-teal-700">Nimisha Khandelwal</strong>, a Counselling Psychologist based in Indore. 
            I hold a Gold Medal in M.A. Psychology from Mohanlal Sukhadia University and specialized training in Clinical Psychology.
          </p>
          <p>
            My journey includes significant tenure at <span className="font-semibold text-slate-800">Allen Career Institute, Kota</span>, where I supported students through high-pressure academic environments.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
              <h4 className="font-bold text-slate-800 mb-1">Education</h4>
              <p className="text-sm">M.A. Psychology (Gold Medalist)</p>
              <p className="text-xs text-slate-500 mt-1">Specialization in Clinical Psychology</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
              <h4 className="font-bold text-slate-800 mb-1">Key Skills</h4>
              <p className="text-sm">CBT, Reality Therapy, Crisis Intervention</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
           <div className="bg-teal-600 text-white p-8 rounded-2xl shadow-xl">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Award className="w-6 h-6" /> Certifications
             </h3>
             <ul className="space-y-4 text-teal-50">
               <li className="flex items-start gap-3">
                 <div className="mt-1.5 w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                 <span>QPR Gatekeeper Certification</span>
               </li>
               <li className="flex items-start gap-3">
                 <div className="mt-1.5 w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                 <span>Choice Theory & Reality Therapy</span>
               </li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  </section>
);

const ExperienceSection = () => {
  const experiences = [
    { role: "Psychological Counsellor", org: "Allen Career Institute, Kota", period: "Sep 2023 - Sep 2024", desc: "Delivered 200+ counselling sessions for high-pressure students." },
    { role: "Counselling Psychologist", org: "Ujala Centre, RNT Medical College", period: "Feb 2023 - Present", desc: "Providing therapy for children with special needs (ADHD, ID, LD)." },
    { role: "Volunteer Psychologist", org: "Student Care Alliance Society", period: "May 2024 - Sep 2024", desc: "Conducted 450+ individual and group sessions with aspirants." }
  ];

  return (
    <section id="experience" className="py-20 px-6 bg-stone-50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-slate-800">Professional Journey</h2><div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full mt-4"></div></div>
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:bg-stone-200 before:h-full">
          {experiences.map((exp, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 translate-x-0"><Calendar size={16} /></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow ml-16 md:ml-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"><h3 className="font-bold text-lg text-slate-800">{exp.role}</h3><span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded-full mt-1 sm:mt-0">{exp.period}</span></div>
                <div className="text-teal-600 font-medium text-sm mb-3 flex items-center gap-1"><MapPin size={14} /> {exp.org}</div>
                <p className="text-slate-600 text-sm leading-relaxed">{exp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const faqs = [
    { q: "How long is each counselling session?", a: "Standard individual sessions typically last for 50-60 minutes. Initial consultations may be slightly longer to gather comprehensive history." },
    { q: "Is my information kept confidential?", a: "Absolutely. Confidentiality is a cornerstone of therapy. Your information is never shared without your consent, except in rare legal circumstances or if there is an immediate risk of harm." },
    { q: "Do you offer online sessions?", a: "Yes, I offer secure online video consultations for clients who prefer to meet remotely or are located outside of Indore." },
    { q: "What is your cancellation policy?", a: "I request at least 24 hours' notice for cancellations. Missed appointments without prior notice may be subject to a cancellation fee." },
    { q: "How do I know if therapy is right for me?", a: "Therapy provides a safe space to explore feelings and develop coping strategies. If you're feeling overwhelmed, stuck, or just want to understand yourself better, therapy can be very beneficial." }
  ];

  return (
    <section id="faq" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Frequently Asked Questions</h2>
                <div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
            </div>
            <div className="space-y-6">
                {faqs.map((faq, i) => (
                    <div key={i} className="border border-stone-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                           <HelpCircle className="w-5 h-5 text-teal-600" />
                           {faq.q}
                        </h3>
                        <p className="text-slate-600 leading-relaxed ml-7">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

const App = () => {
  // --- Navigation & Routing State ---
  const [activePage, setActivePage] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- Firebase Setup ---
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    let firebaseConfig = null;
    if (typeof __firebase_config !== 'undefined') {
      try {
        firebaseConfig = JSON.parse(__firebase_config);
      } catch (e) { logError(e, { context: 'JSON Parse Global Config' }); }
    }
    if (!firebaseConfig && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
      firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
    }
    if (!firebaseConfig) {
      console.warn("No Firebase configuration found. Starting in Demo Mode.");
      setIsDemoMode(true);
      return;
    }
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setDb(firestore);
      const rawId = typeof __app_id !== 'undefined' ? __app_id : 'nimisha-portfolio-prod';
      const sanitizedId = encodeURIComponent(rawId);
      setAppId(sanitizedId);
      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          logError(e, { context: 'Auth Init' });
          setIsDemoMode(true);
        }
      };
      initAuth();
      const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
        setUser(u);
      });
      return () => unsubscribeAuth();
    } catch (err) {
      logError(err, { context: 'Firebase Init' });
      setIsDemoMode(true);
    }
  }, []);

  // Fetch Testimonials
  useEffect(() => {
    if (isDemoMode) {
      setReviews([
        { id: '1', name: 'Priya S.', text: 'Nimisha helped me navigate my anxiety during exams. Highly recommended!', rating: 5, createdAt: { seconds: 1700000000 } },
        { id: '2', name: 'Anonymous', text: 'A very supportive and understanding psychologist.', rating: 4, createdAt: { seconds: 1690000000 } }
      ]);
      return;
    }
    if (!user || !db || !appId) return;
    try {
      let collectionRef;
      if (typeof __app_id !== 'undefined') {
         collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'testimonials');
      } else {
         collectionRef = collection(db, 'testimonials');
      }
      const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(20));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(fetchedReviews);
      }, (error) => {
        logError(error, { context: 'Fetch Reviews' });
        if (reviews.length === 0) setIsDemoMode(true);
      });
      return () => unsubscribe();
    } catch (e) {
      logError(e, { context: 'Review Query' });
      setIsDemoMode(true);
    }
  }, [user, db, appId, isDemoMode]);

  // --- State ---
  const [activeModal, setActiveModal] = useState(null);
  const [formStatus, setFormStatus] = useState('idle');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');
  
  const [bookingStep, setBookingStep] = useState(1); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', phone: '', country: 'in' }); 
  const [customerLookupStatus, setCustomerLookupStatus] = useState('idle'); 
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentConfig, setPaymentConfig] = useState(getPaymentConfig()); 
  const [hasBooked, setHasBooked] = useState(false); 
  const [skipVerification, setSkipVerification] = useState(false);
  const paypalRef = useRef(null);

  const [newReview, setNewReview] = useState({ name: '', text: '', rating: 5, anonymous: false });
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [heroContent, setHeroContent] = useState({
    text: "Empowering youth through mental health support.",
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=800",
    blob1: "bg-teal-200/30", blob2: "bg-purple-200/30"
  });

  // --- Effects ---
  useEffect(() => {
    const refineLocation = async () => {
       const refinedConfig = await getPaymentConfigAsync();
       setPaymentConfig(prev => (prev.currency !== refinedConfig.currency ? refinedConfig : prev));
    };
    refineLocation();
  }, []);

  useEffect(() => {
    if (activeModal === 'booking' && bookingStep === 3) {
      if (paymentConfig.provider === 'Razorpay') {
        loadScript('https://checkout.razorpay.com/v1/checkout.js');
      }
      if (paymentConfig.provider === 'PayPal') {
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'; 
        loadScript(`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`).then(success => {
          if (success && window.paypal && paypalRef.current) {
            paypalRef.current.innerHTML = "";
            window.paypal.Buttons({
              createOrder: (data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: { value: paymentConfig.amount.toString() }
                  }]
                });
              },
              onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                  handlePaymentSuccess(details);
                });
              }
            }).render(paypalRef.current);
          }
        });
      }
    }
  }, [activeModal, bookingStep, paymentConfig]);

  // --- Navigation Logic ---
  const handleNavClick = (id) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (skipVerification) {
        if (bookingDetails.phone && bookingDetails.phone.length >= 7 && (bookingStep === 2)) {
             setCustomerLookupStatus('not-found');
             setIsReturningCustomer(false);
        }
        return;
    }

    const verifyPhone = async () => {
        if (!bookingDetails.phone || bookingDetails.phone.length < 7) return;
        
        setValidationErrors(prev => ({ ...prev, phone: null }));
        setCustomerLookupStatus('searching');

        if (isDemoMode) {
            setTimeout(() => {
                setCustomerLookupStatus('not-found');
                setIsReturningCustomer(false);
            }, 800);
            return;
        }

        try {
            let collectionRef;
            if (typeof __app_id !== 'undefined') {
                collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
            } else {
                collectionRef = collection(db, 'customers');
            }

            const q = query(collectionRef, where('phone', '==', bookingDetails.phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const customerData = querySnapshot.docs[0].data();
                setBookingDetails(prev => ({
                    ...prev,
                    name: customerData.name || '',
                    email: customerData.email || '',
                    country: customerData.country || 'in'
                }));
                setCustomerLookupStatus('found');
                setIsReturningCustomer(true);
                setHasBooked(true); 
            } else {
                setCustomerLookupStatus('not-found');
                setIsReturningCustomer(false);
            }
        } catch (e) {
            console.error("Error looking up customer", e);
            setCustomerLookupStatus('not-found');
            setIsReturningCustomer(false);
        }
    };

    const timeoutId = setTimeout(() => {
        if (bookingDetails.phone && bookingDetails.phone.length >= 7 && (bookingStep === 2 || bookingStep === 0)) {
            verifyPhone();
        } else {
            if (bookingStep !== 0 && bookingStep !== 2) return; 
            setCustomerLookupStatus('idle');
            setIsReturningCustomer(false);
        }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [bookingDetails.phone, db, appId, isDemoMode, bookingStep, skipVerification]);

  const validateInputs = () => {
      const errors = {};
      if (!bookingDetails.phone || bookingDetails.phone.length < 8) errors.phone = "Invalid phone number";
      
      if (!isReturningCustomer) {
          if (!bookingDetails.name || bookingDetails.name.trim().length < 2) errors.name = "Name is required";
          if (!bookingDetails.email || !isEmail(bookingDetails.email)) errors.email = "Valid email is required";
      }
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const saveCustomer = async () => {
    if (isDemoMode || !db) return;

    try {
        let collectionRef;
        if (typeof __app_id !== 'undefined') {
            collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
        } else {
            collectionRef = collection(db, 'customers');
        }

        const q = query(collectionRef, where('phone', '==', bookingDetails.phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, {
                lastBooking: serverTimestamp()
            });
        } else {
            await addDoc(collectionRef, {
                phone: bookingDetails.phone,
                name: bookingDetails.name,
                email: bookingDetails.email,
                country: bookingDetails.country,
                createdAt: serverTimestamp(),
                lastBooking: serverTimestamp()
            });
        }
    } catch (e) {
        console.error("Failed to save customer data", e);
    }
  };

  const handleProceedToPayment = async () => {
      if (!validateInputs()) return;
      await saveCustomer();
      setBookingStep(3);
  };

  const handleVerifyOnly = () => {
      if (customerLookupStatus === 'found') {
          setActiveModal(null); 
      } else if (customerLookupStatus === 'not-found') {
          setSkipVerification(true); 
          setBookingStep(1);
      }
  };

  const openVerifyModal = () => {
      setBookingStep(0); 
      setBookingDetails({ name: '', email: '', phone: '', country: 'in' });
      setCustomerLookupStatus('idle');
      setSkipVerification(false);
      setActiveModal('booking');
  };

  const openBookingModal = () => {
      setBookingStep(1); 
      setBookingDetails({ name: '', email: '', phone: '', country: 'in' });
      setCustomerLookupStatus('idle');
      setSkipVerification(false);
      setActiveModal('booking');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin') { setIsAdmin(true); setActiveModal(null); } 
    else { setAdminError('Incorrect password'); }
  };

  const initiateDelete = (e, reviewId) => {
    e.stopPropagation();
    setReviewToDelete(reviewId);
    setActiveModal('deleteConfirm');
    setDeleteStatus('idle');
  };

  const performDelete = async () => {
    if (!reviewToDelete) return;
    setDeleteStatus('deleting');
    
    if (isDemoMode) {
        setReviews(prev => prev.filter(r => r.id !== reviewToDelete));
        setActiveModal(null); setReviewToDelete(null); setDeleteStatus('idle');
        return;
    }

    if (!db) return;

    try {
      let docRef;
      if (typeof __app_id !== 'undefined') {
          docRef = doc(db, 'artifacts', appId, 'public', 'data', 'testimonials', reviewToDelete);
      } else {
          docRef = doc(db, 'testimonials', reviewToDelete);
      }
      await deleteDoc(docRef);
      setActiveModal(null); setReviewToDelete(null); setDeleteStatus('idle');
    } catch (error) {
      logError(error, { context: 'Delete Review' });
      setDeleteStatus('error');
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    setReviewStatus('submitting');
    
    try {
      const reviewData = {
        name: newReview.anonymous ? "Anonymous" : newReview.name,
        text: newReview.text,
        rating: Number(newReview.rating),
        createdAt: serverTimestamp() 
      };

      if (isDemoMode) {
          const mockReview = { ...reviewData, id: Date.now().toString(), createdAt: { seconds: Date.now()/1000 } };
          setReviews([mockReview, ...reviews]);
          setNewReview({ name: '', text: '', rating: 5, anonymous: false });
          setReviewStatus('success');
          setTimeout(() => setReviewStatus('idle'), 2000);
          return;
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 8000)
      );

      let collectionRef;
      if (typeof __app_id !== 'undefined') {
         collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'testimonials');
      } else {
         collectionRef = collection(db, 'testimonials');
      }

      await Promise.race([
        addDoc(collectionRef, reviewData),
        timeoutPromise
      ]);
      
      setNewReview({ name: '', text: '', rating: 5, anonymous: false });
      setReviewStatus('success');
      setTimeout(() => setReviewStatus('idle'), 2000);
    } catch (error) {
      logError(error, { context: 'Post Review' });
      const mockReview = { 
         name: newReview.anonymous ? "Anonymous" : newReview.name,
         text: newReview.text,
         rating: Number(newReview.rating),
         createdAt: { seconds: Date.now()/1000 },
         id: 'temp-' + Date.now() 
      };
      setReviews([mockReview, ...reviews]);
      setNewReview({ name: '', text: '', rating: 5, anonymous: false });
      setReviewStatus('success'); 
      setTimeout(() => setReviewStatus('idle'), 2000);
    }
  };

  const handlePaymentSuccess = async (details) => {
    setPaymentStatus('success');
    setBookingStep(4);
    setHasBooked(true); 
    
    trackEvent('booking_confirmed', {
        value: paymentConfig.amount,
        currency: paymentConfig.currency,
        provider: paymentConfig.provider
    });
    
    if (import.meta.env.PROD) {
      try {
        await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...bookingDetails, 
                date: selectedDate.toLocaleDateString(), 
                slot: selectedSlot,
                currency: paymentConfig.currency,
                transactionId: details?.id || details?.razorpay_payment_id
            })
        });
      } catch(e) { logError(e, { context: 'Booking API' }); }
    }
  };

  const handleRazorpayPayment = async () => {
    setPaymentStatus('processing');
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!keyId) {
        console.warn("VITE_RAZORPAY_KEY_ID not found. Running in Demo/Simulation mode.");
        await processDemoPayment(paymentConfig, bookingDetails);
        handlePaymentSuccess({ id: "demo_" + Date.now() });
        return;
    }

    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: paymentConfig.amount, currency: paymentConfig.currency })
        });
        const orderData = await response.json();

        if (!orderData.id) throw new Error("Order creation failed");

        const options = {
            key: keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Nimisha Khandelwal",
            description: "Consultation Fee",
            order_id: orderData.id,
            handler: function (response) {
                handlePaymentSuccess(response);
            },
            prefill: {
                name: bookingDetails.name,
                email: bookingDetails.email,
                contact: bookingDetails.phone
            },
            theme: {
                color: "#0d9488"
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.open();
        setPaymentStatus('idle');
    } catch (error) {
        logError(error, { context: 'Razorpay Init' });
        setPaymentStatus('error');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    setFormStatus('sending');
    trackEvent('contact_form_submit');
    setTimeout(() => { 
        setFormStatus('success'); 
        setTimeout(() => setFormStatus('idle'), 3000); 
    }, 1500);
  };

  const resetBooking = () => {
    setActiveModal(null);
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingDetails({ name: '', email: '', phone: '', country: 'India' });
    setCustomerLookupStatus('idle');
    setIsReturningCustomer(false);
    setPaymentStatus('idle');
    setValidationErrors({});
    setSkipVerification(false);
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  };
  
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
    "05:00 PM", "06:00 PM", "07:00 PM"
  ];
  
  const isSlotAvailable = (date, slot) => (date.getDate() + slot.length) % 3 !== 0;

  const navLinks = [
    { name: 'Home', id: 'home' }, { name: 'About', id: 'about' },
    { name: 'Experience', id: 'experience' },
    { name: 'Services', id: 'services' }, { name: 'Testimonials', id: 'testimonials' },
    { name: 'FAQ', id: 'faq' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans selection:bg-teal-100 relative">
      <TrackingManager />

      {isDemoMode && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm text-center flex items-center justify-center gap-2 animate-fade-in">
          <Info size={16} />
          <span><strong>Demo Mode:</strong> Database not configured. Changes will be visible in this session only.</span>
        </div>
      )}

      {/* GDPR Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <Modal title="Privacy Policy (GDPR Compliant)" icon={Shield} onClose={() => setActiveModal(null)}>
          <div className="space-y-6 text-sm text-slate-600">
            <p className="italic">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><User size={16}/> 1. Data Controller</h4>
              <p>The entity responsible for the processing of your personal data is <strong>Nimisha Khandelwal</strong>, located in Indore, Madhya Pradesh, India. You may contact us at <a href="mailto:nimishakhandelwal995@gmail.com" className="text-teal-600 underline">nimishakhandelwal995@gmail.com</a>.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={16}/> 2. Data We Collect</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Personal Identification:</strong> Name, Email Address, Phone Number (provided voluntarily via forms).</li>
                <li><strong>Payment Information:</strong> Processed securely via Razorpay/PayPal. We do not store full credit card details on our servers.</li>
                <li><strong>Usage Data:</strong> IP Address, Browser Type, Session Duration (via Cookies/Analytics).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><Brain size={16}/> 3. Purpose & Legal Basis (GDPR Art. 6)</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Service Provision:</strong> To schedule appointments and provide counseling (Legal Basis: Contractual Necessity).</li>
                <li><strong>Communication:</strong> To send booking confirmations and respond to inquiries (Legal Basis: Legitimate Interest).</li>
                <li><strong>Analytics:</strong> To improve website performance (Legal Basis: Consent via Cookie Banner).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><Lock size={16}/> 4. Data Retention & Sharing</h4>
              <p>We retain personal data only as long as necessary to fulfill the purposes outlined above or to comply with legal obligations. We do not sell your data. Data may be shared with trusted processors (e.g., Vercel, Firebase, Razorpay) under strict confidentiality agreements.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle size={16}/> 5. Your Rights</h4>
              <p>Under GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Rectification:</strong> Correct inaccurate data.</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("Right to be Forgotten").</li>
                <li><strong>Withdraw Consent:</strong> Opt-out of analytics cookies at any time via the consent manager.</li>
              </ul>
            </section>

             <section className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><Cookie size={16}/> 6. Cookies</h4>
              <p>We use essential cookies for site functionality and optional cookies for analytics (Microsoft Clarity, Google Analytics). You can manage your preferences via the banner at the bottom right of the screen.</p>
            </section>
          </div>
        </Modal>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <Modal title="Terms of Service" icon={FileText} onClose={() => setActiveModal(null)}>
           <div className="space-y-4 text-sm text-slate-600">
            <h4 className="font-bold text-slate-800">1. Services</h4>
            <p>Nimisha Khandelwal provides psychological counseling and therapy services. These services are not a substitute for medical advice or emergency psychiatric intervention.</p>
            
            <h4 className="font-bold text-slate-800">2. Emergency Disclaimer</h4>
            <p className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100">If you are in a crisis or suicidal, please contact your local emergency services immediately. This website and its services are not designed for emergency crisis management.</p>

            <h4 className="font-bold text-slate-800">3. Cancellations</h4>
            <p>Please provide at least 24 hours notice for cancellations. Missed appointments without notice may be subject to a fee.</p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === 'deleteConfirm' && (
        <Modal title="Delete Testimonial" icon={AlertTriangle} onClose={() => setActiveModal(null)} className="max-w-md">
           <div className="text-center space-y-4">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 size={32} /></div>
             <p className="text-lg font-medium text-slate-800">Are you sure you want to delete this?</p>
             <div className="flex gap-3 justify-center pt-4">
               <button onClick={() => setActiveModal(null)} className="px-6 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">Cancel</button>
               <button onClick={performDelete} disabled={deleteStatus === 'deleting'} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors flex items-center gap-2">
                 {deleteStatus === 'deleting' ? 'Deleting...' : 'Yes, Delete'}
               </button>
             </div>
           </div>
        </Modal>
      )}

      {/* Admin Login Modal */}
      {activeModal === 'adminLogin' && (
        <Modal title="Admin Login" icon={Lock} onClose={() => setActiveModal(null)}>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="password" placeholder="Password (admin)" className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-teal-500 outline-none" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} />
            {adminError && <p className="text-red-500 text-xs">{adminError}</p>}
            <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700">Login</button>
          </form>
        </Modal>
      )}

      {/* Booking Modal */}
      {activeModal === 'booking' && (
        <Modal title={bookingStep === 0 ? "Verify Phone Number" : "Book Appointment"} icon={bookingStep === 0 ? Phone : Calendar} onClose={resetBooking}>
          
          {/* STEP 0: VERIFY ONLY (FROM TESTIMONIALS) */}
          {bookingStep === 0 && (
            <div className="space-y-6">
              <p className="text-slate-600 text-sm">Please verify your phone number to check if you are eligible to post a testimonial.</p>
              
              <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Mobile Number *</label>
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <PhoneInput
                       country={'in'}
                       value={bookingDetails.phone}
                       onChange={(phone, country) => setBookingDetails({...bookingDetails, phone, country: country.name})}
                       inputClass="!w-full !py-2.5 !h-11 !text-base !rounded-lg !border-stone-200 !font-sans"
                       buttonClass="!bg-white !border-stone-200 !rounded-l-lg"
                       dropdownClass="!shadow-xl !rounded-lg"
                       disabled={customerLookupStatus === 'found'}
                     />
                   </div>
                   <button className="hidden"></button>
                 </div>
                 {customerLookupStatus === 'searching' && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Loader className="animate-spin w-3 h-3"/> Verifying...</p>}
              </div>

              {/* Status Messages for Verify Mode */}
              {customerLookupStatus === 'found' && (
                  <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle className="w-5 h-5"/> 
                        <span>Verified!</span>
                      </div>
                      <p className="text-sm text-green-600">You can now post your testimonial.</p>
                      <button onClick={handleVerifyOnly} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-green-700 transition-colors">Continue to Testimonials</button>
                  </div>
              )}

              {customerLookupStatus === 'not-found' && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <Info className="w-5 h-5"/> 
                        <span>Number not found</span>
                      </div>
                      <p className="text-sm text-blue-600">We couldn't find a booking associated with this number. Would you like to book a session?</p>
                      <button onClick={handleVerifyOnly} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-blue-700 transition-colors">Book a Session</button>
                  </div>
              )}
            </div>
          )}

          {bookingStep === 1 && (
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-800 mb-4">Select Date</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {generateDates().map((date, i) => (
                  <button key={i} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }} className={`min-w-[80px] p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${selectedDate?.toDateString() === date.toDateString() ? 'bg-teal-600 text-white shadow-lg' : 'bg-white border-stone-200'}`}>
                    <span className="text-xs font-medium uppercase opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span><span className="text-xl font-bold">{date.getDate()}</span>
                  </button>
                ))}
              </div>
              {selectedDate && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{timeSlots.map((slot, i) => (<button key={i} disabled={!isSlotAvailable(selectedDate, slot)} onClick={() => setSelectedSlot(slot)} className={`py-2 px-4 rounded-lg text-sm font-medium border ${selectedSlot === slot ? 'bg-teal-600 text-white' : 'bg-white border-stone-200'}`}>{slot}</button>))}</div>}
              <div className="flex justify-end pt-4"><button disabled={!selectedDate || !selectedSlot} onClick={() => setBookingStep(2)} className="bg-teal-600 disabled:bg-stone-300 text-white px-6 py-2.5 rounded-lg font-bold">Next</button></div>
            </div>
          )}
          {bookingStep === 2 && (
            <div className="space-y-6">
              {/* Phone Input with Country Code */}
              <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Mobile Number *</label>
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <PhoneInput
                       country={'in'}
                       value={bookingDetails.phone}
                       onChange={(phone, country) => setBookingDetails({...bookingDetails, phone, country: country.name})}
                       inputClass="!w-full !py-2.5 !h-11 !text-base !rounded-lg !border-stone-200 !font-sans"
                       buttonClass="!bg-white !border-stone-200 !rounded-l-lg"
                       dropdownClass="!shadow-xl !rounded-lg"
                       disabled={customerLookupStatus === 'found'}
                     />
                   </div>
                   <button 
                      onClick={() => { /* Removing manual button, logic is handled by useEffect */ }}
                      className="hidden" // Hiding button as per request
                   >
                   </button>
                 </div>
                 {/* Show loading indicator or status next to input if needed, or rely on useEffect logic */}
                 {customerLookupStatus === 'searching' && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Loader className="animate-spin w-3 h-3"/> Verifying...</p>}
                 {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
              </div>
              
              {/* Customer Found State - Hidden Details */}
              {customerLookupStatus === 'found' && (
                  <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle className="w-5 h-5"/> 
                        <span>Welcome back!</span>
                      </div>
                      <p className="text-sm text-green-600">We have retrieved your details securely. You can proceed to payment.</p>
                      <button onClick={() => { setCustomerLookupStatus('idle'); setIsReturningCustomer(false); setBookingDetails(prev => ({...prev, name: '', email: ''})); }} className="text-xs text-slate-500 underline text-left mt-1 hover:text-slate-700">Not you? Enter details manually</button>
                  </div>
              )}

              {/* New Customer State - Input Fields */}
              {(!isReturningCustomer && customerLookupStatus !== 'searching') && (
                <div className={`space-y-4 animate-fade-in ${customerLookupStatus === 'idle' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                  {customerLookupStatus === 'idle' && <div className="text-xs text-center text-slate-400 -mb-2">Verify mobile number to proceed</div>}
                  
                  {customerLookupStatus === 'not-found' && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 flex-shrink-0"/> Looks like you're new here. Please enter your details.
                    </div>
                  )}

                  <div>
                    <input 
                      type="text" 
                      placeholder="Full Name *" 
                      className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${validationErrors.name ? 'border-red-300' : 'border-stone-200'}`}
                      value={bookingDetails.name} 
                      onChange={e => setBookingDetails({...bookingDetails, name: e.target.value})} 
                    />
                    {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                  </div>

                  <div>
                    <input 
                      type="email" 
                      placeholder="Email Address *" 
                      className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${validationErrors.email ? 'border-red-300' : 'border-stone-200'}`}
                      value={bookingDetails.email} 
                      onChange={e => setBookingDetails({...bookingDetails, email: e.target.value})} 
                    />
                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-stone-100">
                <button onClick={() => setBookingStep(1)} className="text-slate-500 hover:text-slate-800 font-medium transition-colors">Back</button>
                <button 
                  disabled={customerLookupStatus === 'idle' || customerLookupStatus === 'searching'}
                  onClick={handleProceedToPayment} 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                >
                  Proceed
                </button>
              </div>
            </div>
          )}
          {bookingStep === 3 && (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="mb-6">
                <p className="text-slate-500 text-sm uppercase tracking-wide font-semibold">Total Amount</p>
                <h3 className="text-4xl font-bold text-slate-900 mt-1">
                  {paymentConfig ? `${paymentConfig.symbol}${paymentConfig.amount}` : '...'}
                </h3>
              </div>

              <div className="bg-slate-50 border border-stone-200 p-6 rounded-xl space-y-4">
                {paymentConfig?.isIndia ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-slate-700 font-medium pb-2 border-b border-stone-200">
                      <CreditCard size={20} className="text-blue-600" /> Pay via Razorpay
                    </div>
                    <p className="text-xs text-slate-500">Secure payment for Indian cards, UPI, and Netbanking.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-slate-700 font-medium pb-2 border-b border-stone-200">
                      <CreditCard size={20} className="text-blue-600" /> Pay via PayPal
                    </div>
                    <p className="text-xs text-slate-500">Secure international payment for global cards.</p>
                  </div>
                )}
              </div>

              {/* Dynamic Payment Buttons */}
              <div className="pt-4">
                {paymentConfig.provider === 'PayPal' ? (
                   <div className="w-full">
                      {/* PayPal Container */}
                      <div ref={paypalRef} className="min-h-[150px] flex items-center justify-center">
                         <div className="text-sm text-gray-400">Loading PayPal...</div>
                      </div>
                      <button onClick={() => setBookingStep(2)} className="mt-4 text-slate-500 font-medium hover:text-slate-700 text-sm">Back</button>
                   </div>
                ) : (
                   <div className="flex justify-between items-center">
                    <button onClick={() => setBookingStep(2)} className="text-slate-500 font-medium hover:text-slate-700">Back</button>
                    <button 
                      onClick={handleRazorpayPayment} 
                      disabled={paymentStatus === 'processing'} 
                      className="w-full sm:w-auto px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {paymentStatus === 'processing' ? <><Loader className="w-4 h-4 animate-spin"/> Processing...</> : "Pay with Razorpay"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {bookingStep === 4 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Confirmed!</h3>
              <p>Email sent to {bookingDetails.email}</p>
              <button onClick={resetBooking} className="mt-6 bg-slate-800 text-white px-6 py-2 rounded-lg">Done</button>
            </div>
          )}
        </Modal>
      )}

      {/* Navigation */}
      <nav className={`fixed ${isDemoMode ? 'top-10' : 'top-0'} w-full bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-stone-100 transition-all`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('home')}>
             <Brain className="w-6 h-6 text-teal-600" />
             <span className="text-xl font-bold text-slate-800">Nimisha Khandelwal</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map(l => (
              <button 
                key={l.id} 
                onClick={() => handleNavClick(l.id)} 
                className={`text-sm font-medium transition-colors ${activePage === l.id ? 'text-teal-600 font-bold' : 'text-slate-600 hover:text-teal-600'}`}
              >
                {l.name}
              </button>
            ))}
            <button onClick={openBookingModal} className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg">Book Appointment</button>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu /></button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 absolute w-full shadow-lg p-4 flex flex-col gap-4 animate-slide-in">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => handleNavClick(l.id)} className="text-left font-medium text-slate-700">
                {l.name}
              </button>
            ))}
            <button onClick={openBookingModal} className="bg-teal-600 text-white py-3 rounded-lg font-bold">Book Appointment</button>
          </div>
        )}
      </nav>

      {/* Page Content Rendering */}
      <HeroSection openBookingModal={openBookingModal} handleNavClick={handleNavClick} heroContent={heroContent} />
      <AboutSection />
      <ExperienceSection />
      <ServicesSection />
      <TestimonialsSection 
          reviews={reviews} 
          isAdmin={isAdmin} 
          initiateDelete={initiateDelete} 
          hasBooked={hasBooked} 
          handlePostReview={handlePostReview} 
          newReview={newReview} 
          setNewReview={setNewReview} 
          reviewStatus={reviewStatus} 
          openVerifyModal={openVerifyModal} 
      />
      <FAQSection />
      <ContactSection handleSendMessage={handleSendMessage} formStatus={formStatus} />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4"><Brain className="w-6 h-6 text-teal-600" /><span className="text-lg font-bold text-white">Nimisha Khandelwal</span></div>
          <p className="text-sm mb-6 flex items-center justify-center gap-2">© {new Date().getFullYear()} Nimisha Khandelwal. All rights reserved.<button onClick={() => setActiveModal('adminLogin')} className="opacity-20 hover:opacity-100 transition-opacity"><Lock size={12} /></button></p>
          <div className="flex justify-center gap-6">
            <a href="https://www.linkedin.com/in/nimisha-khandelwal" target="_blank" rel="noopener noreferrer" className="hover:text-teal-500 transition-colors">LinkedIn</a>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-teal-500 transition-colors">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-teal-500 transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppWrapper = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWrapper;