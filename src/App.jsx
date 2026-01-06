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
import { 
  trackEvent, logError, trackWebsiteVisit, trackSectionView, trackCTAClick, 
  trackExternalClick, trackPhoneClick, trackWhatsAppClick, trackBookingFunnel,
  trackTestimonial, trackFAQ, trackModalOpen 
} from './lib/tracking.js';

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

const ContactSection = ({ handleSendMessage, formStatus, onWhatsAppClick, onReset }) => {
  // Use state to manage form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: 'in',
    message: ''
  });

  const onSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(formData);
    setFormData({ name: '', phone: '', country: 'in', message: '' });
  };

  return (
    <section id="contact" className="py-20 px-6 bg-slate-900 text-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div><h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Journey Today</h2><div className="w-20 h-1.5 bg-teal-500 rounded-full mb-6"></div><p className="text-slate-300 text-lg">Taking the first step towards mental wellness is a sign of strength. Reach out to schedule a consultation or for any inquiries.</p></div>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><Phone className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Call Me</h3><a href="tel:+918000401045" onClick={() => trackPhoneClick()} className="text-slate-300 hover:text-white transition-colors">+91-8000401045</a></div></div>
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><Mail className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Email Me</h3><a href="mailto:nimishakhandelwal995@gmail.com" className="text-slate-300 hover:text-white transition-colors break-all">nimishakhandelwal995@gmail.com</a></div></div>
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"><div className="bg-teal-600 p-3 rounded-lg"><MapPin className="w-6 h-6" /></div><div><h3 className="font-semibold text-lg">Location</h3><p className="text-slate-300">142 Royal Bungalow, Sukhliya<br />Indore, MP 42010</p></div></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 text-slate-800 shadow-2xl">
              {formStatus === 'success' ? (
                /* Success State with WhatsApp Option */
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 mb-6">I'll get back to you soon via email or phone.</p>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">Want a faster response?</p>
                    <button 
                      onClick={onWhatsAppClick}
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Chat on WhatsApp
                    </button>
                    <button 
                      onClick={onReset}
                      className="w-full text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <>
                  <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" 
                        placeholder="John Doe" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <PhoneInput
                        country={'in'}
                        value={formData.phone}
                        onChange={(phone, country) => setFormData({...formData, phone, country: country.name})}
                        inputClass="!w-full !py-3 !h-12 !text-base !rounded-lg !border-stone-200 !bg-stone-50 !font-sans focus:!border-teal-500 focus:!ring-2 focus:!ring-teal-200"
                        buttonClass="!bg-stone-50 !border-stone-200 !rounded-l-lg !h-12"
                        dropdownClass="!shadow-xl !rounded-lg"
                        containerClass="!w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                      <textarea 
                        rows="4" 
                        className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all resize-none" 
                        placeholder="How can I help you?" 
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      ></textarea>
                    </div>
                    <button type="submit" disabled={formStatus === 'sending'} className="w-full font-bold py-3.5 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-teal-400">
                      {formStatus === 'sending' ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Sending...</>
                      ) : (
                        <><Send className="w-5 h-5" />Send Message</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
    </section>
  );
};

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

const FAQPage = () => {
  const faqs = [
    { q: "Why do I need counseling?", a: "Counseling provides a supportive environment to explore personal challenges, improve mental well-being, and develop coping strategies for various life stressors." },
    { q: "Who can take an appointment?", a: "Anyone seeking support for mental health, emotional difficulties, or personal growth can book an appointment. This includes children, adolescents, and adults." },
    { q: "What are the benefits of counseling?", a: "Counseling can lead to better self-understanding, improved relationships, reduced stress, enhanced problem-solving skills, and greater emotional resilience." },
    { q: "What is the online procedure?", a: "Online sessions are conducted via secure video conferencing platforms. After booking, you will receive a link to join the session at the scheduled time." },
    { q: "What is the offline procedure?", a: "For offline sessions, you will visit the clinic at the scheduled time. Strict hygiene and safety protocols are followed for in-person consultations." },
    { q: "Will my information be kept confidential?", a: "Yes, confidentiality is paramount. Your information is kept private and is only shared in exceptional circumstances where there is a risk of harm to yourself or others, or as required by law." },
    { q: "Does counseling really help to deal with problems?", a: "Yes, evidence-based therapies like CBT and others used in counseling are effective in helping individuals manage and overcome various mental health challenges." },
    { q: "What is Psychotherapy?", a: "Psychotherapy, or talk therapy, involves discussing your thoughts and feelings with a trained professional to understand and resolve psychological problems." },
    { q: "Does seeking counseling mean I’m not normal?", a: "Not at all. Seeking counseling is a sign of strength and a proactive step towards mental wellness. It is normal to need support at times." },
    { q: "When does a child or individual need an assessment?", a: "An assessment may be needed if there are persistent behavioral changes, learning difficulties, emotional distress, or developmental concerns." },
    { q: "What about vacations and canceled sessions?", a: "Advance notice is required for cancellations or rescheduling. Specific policies regarding vacations and missed sessions will be discussed during the initial consultation." },
    { q: "What happens in the first session?", a: "The first session is typically an intake assessment where we discuss your background, current concerns, and goals for therapy to create a tailored treatment plan." }
  ];

  // Helper component for individual FAQ item
  const FAQItem = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
        >
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
             <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
             {faq.q}
          </h3>
          <ChevronLeft className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? '-rotate-90' : ''}`} />
        </button>
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <p className="text-slate-600 leading-relaxed p-4 pt-0 ml-12 border-t-0 border-stone-100">
            {faq.a}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section id="faq" className="pt-32 pb-20 px-6 bg-white min-h-screen animate-fade-in">
        <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Frequently Asked Questions</h2>
                <div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
            </div>
            <div className="space-y-3">
                {faqs.map((faq, i) => (
                    <FAQItem key={i} faq={faq} />
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarCache, setCalendarCache] = useState({}); // Cache for all fetched availability
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
      // Check for URL parameter to force PayPal mode (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      const forcePayPal = urlParams.get('paypal') === 'true';
      const forceRazorpay = urlParams.get('razorpay') === 'true';
      
      if (forcePayPal) {
        console.log('🧪 TEST MODE: Forcing PayPal');
        setPaymentConfig({ isIndia: false, currency: 'USD', amount: 30, provider: 'PayPal', symbol: '$', testMode: true });
        return;
      }
      
      if (forceRazorpay) {
        console.log('🧪 TEST MODE: Forcing Razorpay');
        setPaymentConfig({ isIndia: true, currency: 'INR', amount: 1500, provider: 'Razorpay', symbol: '₹', testMode: true });
        return;
      }
      
      const refinedConfig = await getPaymentConfigAsync();
      setPaymentConfig(prev => (prev.currency !== refinedConfig.currency ? refinedConfig : prev));
    };
    refineLocation();
    
    // Track website visit on initial load
    trackWebsiteVisit();
  }, []);

  useEffect(() => {
    if (activeModal === 'booking' && bookingStep === 3 && paymentConfig) {
      if (paymentConfig.provider === 'Razorpay') {
        loadScript('https://checkout.razorpay.com/v1/checkout.js');
      }
      if (paymentConfig.provider === 'PayPal') {
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
        
        if (!clientId) {
          console.warn("VITE_PAYPAL_CLIENT_ID not found. PayPal buttons will not load.");
          if (paypalRef.current) {
            paypalRef.current.innerHTML = `
              <div class="text-center py-4">
                <p class="text-amber-600 text-sm">PayPal is not configured. Please contact support or try again later.</p>
              </div>
            `;
          }
          return;
        }
        
        loadScript(`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`).then(success => {
          if (success && window.paypal && paypalRef.current) {
            paypalRef.current.innerHTML = "";
            window.paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay'
              },
              createOrder: async (data, actions) => {
                // Check slot availability BEFORE creating PayPal order
                if (selectedDate && selectedSlot) {
                  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  try {
                    const checkRes = await fetch(`/api/calendar/check?date=${dateStr}&slot=${encodeURIComponent(selectedSlot)}`);
                    const checkData = await checkRes.json();
                    if (!checkData.available) {
                      setSlotConflictError(`The ${selectedSlot} slot has just been booked. Please select another time.`);
                      setCalendarCache({});
                      setSelectedSlot(null);
                      setBookingStep(1);
                      throw new Error('Slot no longer available');
                    }
                  } catch (e) {
                    if (e.message === 'Slot no longer available') throw e;
                    // If check fails, proceed anyway
                  }
                }
                return actions.order.create({
                  purchase_units: [{
                    amount: { value: paymentConfig.amount.toString() },
                    description: 'Consultation Fee - Nimisha Khandelwal'
                  }]
                });
              },
              onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                  handlePaymentSuccess(details);
                });
              },
              onCancel: () => {
                console.log('PayPal payment cancelled');
                setPaymentStatus('idle');
              },
              onError: (err) => {
                console.error('PayPal error:', err);
                if (!err.message?.includes('Slot no longer available')) {
                  setPaymentErrorMsg('PayPal payment failed. Please try again or use a different payment method.');
                  setPaymentStatus('error');
                }
              }
            }).render(paypalRef.current);
          } else if (paypalRef.current) {
            paypalRef.current.innerHTML = `
              <div class="text-center py-4">
                <p class="text-red-600 text-sm">Failed to load PayPal. Please refresh the page.</p>
              </div>
            `;
          }
        });
      }
    }
  }, [activeModal, bookingStep, paymentConfig]);

  // Helper to format date as YYYY-MM-DD
  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch availability for all dates when booking modal opens (single API call)
  useEffect(() => {
    const fetchAllAvailability = async () => {
      // Only fetch when booking modal is open and we don't have cached data
      if (activeModal !== 'booking' || bookingStep !== 1) return;
      if (Object.keys(calendarCache).length > 0) return; // Already cached
      
      setSlotsLoading(true);
      try {
        const today = new Date();
        const startDateStr = formatDateStr(today);
        
        const response = await fetch(`/api/calendar?date=${startDateStr}&days=14`);
        
        if (response.ok) {
          const data = await response.json();
          setCalendarCache(data.availability || {});
          console.log('📅 Fetched availability for 14 days');
        } else {
          console.warn('Failed to fetch calendar availability');
        }
      } catch (error) {
        console.warn('Failed to fetch availability:', error);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAllAvailability();
  }, [activeModal, bookingStep, calendarCache]);

  // Update available slots from cache when date is selected (instant, no API call)
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const dateStr = formatDateStr(selectedDate);
    
    // Check if we have cached data for this date
    if (calendarCache[dateStr]) {
      setAvailableSlots(calendarCache[dateStr]);
    } else {
      // Fallback: all slots available (for dates outside cache range)
      const defaultSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM", "07:00 PM"
      ];
      setAvailableSlots(defaultSlots.map(time => ({ time, available: true })));
    }
  }, [selectedDate, calendarCache]);

  // --- Navigation Logic ---
  const handleNavClick = (id) => {
    setIsMenuOpen(false);
    
    // Separate FAQ page logic
    if (id === 'faq') {
      setActivePage('faq');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      trackFAQ.viewed();
      return;
    }

    if (activePage !== 'home') {
      setActivePage('home');
      // Wait for re-render if switching from FAQ page back to home components
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
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
      trackBookingFunnel.detailsFilled();
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
      trackEvent('booking_started');
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
      trackTestimonial.submitted(newReview.rating);
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

  const [slotConflictError, setSlotConflictError] = useState(null);
  const [processingStep, setProcessingStep] = useState(0); // 0: payment, 1: creating booking, 2: sending email, 3: done
  const [paymentErrorMsg, setPaymentErrorMsg] = useState(null); // Store specific error message

  const handlePaymentSuccess = async (details) => {
    // Show processing screen immediately
    setBookingStep(5); // New step for processing
    setProcessingStep(1); // Creating booking...
    
    // Format date in local timezone (YYYY-MM-DD) to avoid UTC conversion issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    try {
      setProcessingStep(2); // Confirming appointment...
      
      const response = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              ...bookingDetails, 
              date: localDateStr, // YYYY-MM-DD in local timezone
              dateDisplay: selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
              slot: selectedSlot,
              currency: paymentConfig.currency,
              amount: paymentConfig.amount,
              transactionId: details?.id || details?.razorpay_payment_id
          })
      });
      
      const data = await response.json();
      
      // Check if slot was already booked by someone else
      if (response.status === 409 && data.error === 'SLOT_UNAVAILABLE') {
        console.warn('Slot conflict detected:', data.message);
        setSlotConflictError(data.message);
        setPaymentStatus('idle');
        setCalendarCache({}); // Clear cache to refresh availability
        setSelectedSlot(null);
        setProcessingStep(0);
        setBookingStep(1); // Go back to slot selection
        return;
      }
      
      setProcessingStep(3); // Sending confirmation...
      
      // Small delay for visual feedback
      await new Promise(r => setTimeout(r, 800));
      
      setProcessingStep(4); // Complete!
      
      // Another small delay before showing success
      await new Promise(r => setTimeout(r, 500));
      
      // Success!
      setPaymentStatus('success');
      setBookingStep(4);
      setHasBooked(true); 
      setSlotConflictError(null);
      setProcessingStep(0);
      
      trackEvent('booking_confirmed', {
          value: paymentConfig.amount,
          currency: paymentConfig.currency,
          provider: paymentConfig.provider
      });
      
    } catch(e) { 
      logError(e, { context: 'Booking API' });
      // Still show success (payment was completed, booking might have succeeded)
      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 500));
      setPaymentStatus('success');
      setBookingStep(4);
      setHasBooked(true);
      setProcessingStep(0);
    }
  };

  // Check slot availability BEFORE payment
  const checkSlotAvailability = async () => {
    const dateStr = formatDateStr(selectedDate);
    
    try {
      const response = await fetch(`/api/calendar/check?date=${dateStr}&slot=${encodeURIComponent(selectedSlot)}`);
      const data = await response.json();
      
      if (!data.available) {
        setSlotConflictError(`The ${selectedSlot} slot has just been booked. Please select another time.`);
        setCalendarCache({}); // Clear cache to refresh
        setSelectedSlot(null);
        setBookingStep(1);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Availability check failed, proceeding with payment:', error);
      // If check fails, proceed anyway - the booking API has a final check
      return true;
    }
  };

  const handleRazorpayPayment = async () => {
    setPaymentStatus('processing');
    trackBookingFunnel.paymentInitiated('Razorpay', paymentConfig.amount);
    
    // Step 1: Check if slot is still available BEFORE payment
    const isAvailable = await checkSlotAvailability();
    if (!isAvailable) {
      setPaymentStatus('idle');
      return;
    }
    
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!keyId) {
      // Demo mode
      console.warn("VITE_RAZORPAY_KEY_ID not found. Running in Demo/Simulation mode.");
      await processDemoPayment(paymentConfig, bookingDetails);
      handlePaymentSuccess({ id: "demo_" + Date.now() });
      return;
    }

    try {
        // Ensure Razorpay script is loaded
        const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error("Failed to load Razorpay SDK");
        }

        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: paymentConfig.amount, currency: paymentConfig.currency })
        });
        
        const orderData = await response.json();
        
        if (!response.ok) {
          console.error('Payment API error:', orderData);
          throw new Error(orderData.error || "Payment order creation failed. Please try again.");
        }

        if (!orderData.id) throw new Error("Order creation failed - no order ID");

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
            },
            modal: {
                ondismiss: function() {
                    console.log('Razorpay modal dismissed');
                    setPaymentStatus('idle');
                    setPaymentErrorMsg(null);
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            console.error('Razorpay payment failed:', response.error);
            const errorDesc = response.error?.description || 'Payment was declined. Please try again.';
            setPaymentErrorMsg(errorDesc);
            setPaymentStatus('error');
            // Keep on step 3 - error UI is shown within step 3
            trackBookingFunnel.paymentFailed('Razorpay', errorDesc);
        });
        rzp1.open();
    } catch (error) {
        console.error('Razorpay error:', error);
        logError(error, { context: 'Razorpay Init' });
        setPaymentErrorMsg(error.message || 'Failed to initialize payment. Please try again.');
        setPaymentStatus('error');
        // Keep on step 3 - error UI is shown within step 3
    }
  };

  const [lastContactForm, setLastContactForm] = useState(null);

  const handleSendMessage = async (formData) => {
    setFormStatus('sending');
    setLastContactForm(formData); // Store for WhatsApp option
    
    // Send Email Notification (Primary method - works silently in background)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Email API error:", errorData);
      } else {
        console.log('✅ Email sent successfully');
      }
      
      trackEvent('contact_form_submit');
    } catch (error) {
      console.warn("Contact API error:", error);
    }

    setFormStatus('success');
    // Don't auto-reset - let user see the WhatsApp option
  };

  const handleWhatsAppFollowUp = () => {
    if (lastContactForm) {
      const text = `Hello Nimisha, I have a query.%0A%0A*Name:* ${lastContactForm.name}%0A*Phone:* ${lastContactForm.phone}%0A*Message:* ${lastContactForm.message}`;
      window.open(`https://wa.me/918000401045?text=${text}`, '_blank');
      // Track this specific action - user chose WhatsApp after sending email
      trackEvent('whatsapp_followup_clicked', { 
        source: 'contact_form_success',
        had_message: true 
      });
    }
    setFormStatus('idle');
    setLastContactForm(null);
  };

  const resetContactForm = () => {
    setFormStatus('idle');
    setLastContactForm(null);
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
    setCalendarCache({}); // Clear cache so fresh data is fetched next time
    setSlotConflictError(null); // Clear any conflict errors
    setProcessingStep(0);
    setPaymentErrorMsg(null);
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) { // Show 30 days instead of 7
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  };
  
  // Time slots are now fetched from /api/calendar based on Google Calendar availability

  const navLinks = [
    { name: 'Home', id: 'home' }, { name: 'About', id: 'about' },
    { name: 'Experience', id: 'experience' },
    { name: 'Services', id: 'services' }, { name: 'Testimonials', id: 'testimonials' },
    { name: 'Contact', id: 'contact' },
    { name: 'FAQ', id: 'faq' },
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
              {/* Slot Conflict Warning */}
              {slotConflictError && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Slot No Longer Available</p>
                    <p className="text-sm text-amber-700 mt-1">{slotConflictError}</p>
                    <p className="text-sm text-amber-600 mt-2">Your payment has been processed. Please select another time slot.</p>
                  </div>
                </div>
              )}
              <h4 className="font-semibold text-slate-800 mb-4">Select Date</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {generateDates().map((date, i) => (
                  <button key={i} onClick={() => { setSelectedDate(date); setSelectedSlot(null); trackBookingFunnel.dateSelected(date.toDateString()); }} className={`min-w-[80px] p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${selectedDate?.toDateString() === date.toDateString() ? 'bg-teal-600 text-white shadow-lg' : 'bg-white border-stone-200 hover:border-teal-300'}`}>
                    <span className="text-xs font-medium uppercase opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-xl font-bold">{date.getDate()}</span>
                    <span className="text-xs opacity-70">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </button>
                ))}
              </div>
              {selectedDate && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Select Time</h4>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-teal-600" />
                      <span className="ml-2 text-slate-500">Checking availability...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map((slot, i) => (
                        <button 
                          key={i} 
                          disabled={!slot.available} 
                          onClick={() => { setSelectedSlot(slot.time); setSlotConflictError(null); trackBookingFunnel.slotSelected(slot.time); }} 
                          className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                            selectedSlot === slot.time 
                              ? 'bg-teal-600 text-white border-teal-600' 
                              : slot.available 
                                ? 'bg-white border-stone-200 hover:border-teal-300' 
                                : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                          {!slot.available && <span className="block text-xs">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              {/* Fallback if paymentConfig not ready */}
              {!paymentConfig ? (
                <div className="py-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-slate-500">Loading payment options...</p>
                </div>
              ) : (
              <>
              {/* Test Mode Indicator */}
              {paymentConfig.testMode && (
                <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium">
                  🧪 TEST MODE - Use sandbox credentials
                </div>
              )}
              <div className="mb-6">
                <p className="text-slate-500 text-sm uppercase tracking-wide font-semibold">Total Amount</p>
                <h3 className="text-4xl font-bold text-slate-900 mt-1">
                  {`${paymentConfig.symbol}${paymentConfig.amount}`}
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

              {/* Payment Error Message */}
              {paymentStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-800 font-semibold">Payment Failed</p>
                      <p className="text-sm text-red-600 mt-1">{paymentErrorMsg || 'Your payment could not be processed.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setPaymentStatus('idle'); setPaymentErrorMsg(null); }} 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => { setBookingStep(1); setPaymentStatus('idle'); setPaymentErrorMsg(null); }} 
                      className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Change Slot
                    </button>
                  </div>
                  <p className="text-xs text-red-500 text-center">Need help? Contact us at +91-8000401045</p>
                </div>
              )}

              {/* Dynamic Payment Buttons */}
              <div className="pt-4">
                {paymentConfig?.provider === 'PayPal' ? (
                   <div className="w-full space-y-4">
                      {/* PayPal Container */}
                      <div ref={paypalRef} className="min-h-[100px] flex items-center justify-center">
                         <div className="flex items-center gap-2 text-sm text-gray-400">
                           <Loader className="w-4 h-4 animate-spin" /> Loading PayPal...
                         </div>
                      </div>
                      <button onClick={() => setBookingStep(2)} className="w-full text-center text-slate-500 font-medium hover:text-slate-700 text-sm py-2">← Back</button>
                   </div>
                ) : (
                   <div className="space-y-4">
                    <button 
                      onClick={handleRazorpayPayment} 
                      disabled={paymentStatus === 'processing'} 
                      className="w-full px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
                    >
                      {paymentStatus === 'processing' ? <><Loader className="w-4 h-4 animate-spin"/> Processing...</> : `Pay ${paymentConfig?.symbol || '₹'}${paymentConfig?.amount || ''} with Razorpay`}
                    </button>
                    <button onClick={() => setBookingStep(2)} className="w-full text-center text-slate-500 font-medium hover:text-slate-700 text-sm py-2">← Back</button>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}
          {/* Processing State - After Payment, Before Success */}
          {bookingStep === 5 && (
            <div className="py-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Completing Your Booking</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait, do not close this window</p>
              </div>
              
              {/* Progress Steps */}
              <div className="space-y-3 max-w-xs mx-auto">
                {[
                  { step: 1, label: 'Payment received' },
                  { step: 2, label: 'Creating appointment' },
                  { step: 3, label: 'Sending confirmation email' },
                  { step: 4, label: 'Booking complete' }
                ].map(({ step, label }) => (
                  <div key={step} className={`flex items-center gap-3 transition-all duration-300 ${processingStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      processingStep > step 
                        ? 'bg-green-500 text-white' 
                        : processingStep === step 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-slate-200 text-slate-400'
                    }`}>
                      {processingStep > step ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : processingStep === step ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-xs">{step}</span>
                      )}
                    </div>
                    <span className={`text-sm ${processingStep >= step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-8 max-w-xs mx-auto">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(processingStep / 4) * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">{Math.round((processingStep / 4) * 100)}% complete</p>
              </div>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h3>
              <p className="text-slate-600 mb-1">Your appointment has been scheduled</p>
              <p className="text-sm text-slate-500">Confirmation email sent to <span className="font-medium text-slate-700">{bookingDetails.email}</span></p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-2 text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{selectedDate?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{selectedSlot}</span>
                </div>
              </div>
              
              <button onClick={resetBooking} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Done
              </button>
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
      {activePage === 'faq' ? (
        <FAQPage />
      ) : (
        <>
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
          <ContactSection 
            handleSendMessage={handleSendMessage} 
            formStatus={formStatus} 
            onWhatsAppClick={handleWhatsAppFollowUp}
            onReset={resetContactForm}
          />
        </>
      )}

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