import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">DeepGuard AI</span>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            B.Tech Final Year Project
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Integrated Deepfake Audio Detection & <span className="text-indigo-600">Speaker Verification</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
              A dual-stage authentication system leveraging MFCC feature extraction and Support Vector Machines to detect synthetic audio and verify speaker identity with high precision.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/detect"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                Start Detection System
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Activity className="w-8 h-8 text-indigo-500" />}
            title="Stage 1: Deepfake Detection"
            description="Binary classification using SVM to distinguish between real human speech and AI-generated synthetic audio."
          />
          <FeatureCard 
            icon={<Lock className="w-8 h-8 text-emerald-500" />}
            title="Stage 2: Speaker Verification"
            description="Cosine similarity analysis of MFCC feature vectors to verify if the speaker matches the reference identity."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-blue-500" />}
            title="Robust Security"
            description="A layered defense mechanism ensuring that only verified, real human voices are authenticated."
          />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} B.Tech Project. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
