'use client'
import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  User, 
  Sparkles, 
  Download, 
  Moon, 
  Sun, 
  Wand2,
  X,
  Check,
  Loader2,
  RefreshCw,
  Eye,
  Archive,
  ChevronRight,
  ChevronLeft,
  Play,
  Gamepad2,
  BookOpen,
  Music,
  Wrench,
  Utensils,
  Heart,
  Camera,
  Zap,
  Target,
  TrendingUp,
  Users,
  Clock,
  Star
} from 'lucide-react';

export default function YouTubeThumbnailGenerator() {
  // State variables
  const [isDark, setIsDark] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Questionnaire, 3: Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [generatedThumbnails, setGeneratedThumbnails] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  // Questionnaire data
  const [formData, setFormData] = useState({
    placement: 'right',
    videoType: '',
    style: '',
    mood: '',
    title: '',
    additionalText: ''
  });
  
  const fileInputRef = useRef(null);

  // Video type options with icons and descriptions
  const videoTypes = [
    { id: 'gaming', label: 'Gaming', icon: Gamepad2, desc: 'Gameplay, reviews, tutorials' },
    { id: 'educational', label: 'Educational', icon: BookOpen, desc: 'Tutorials, how-to, learning' },
    { id: 'entertainment', label: 'Entertainment', icon: Play, desc: 'Comedy, reactions, vlogs' },
    { id: 'music', label: 'Music', icon: Music, desc: 'Covers, original songs, reviews' },
    { id: 'tech', label: 'Tech Review', icon: Wrench, desc: 'Product reviews, tech news' },
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart, desc: 'Daily life, fashion, travel' },
    { id: 'cooking', label: 'Cooking', icon: Utensils, desc: 'Recipes, food reviews' },
    { id: 'photography', label: 'Photography', icon: Camera, desc: 'Photo tips, gear reviews' }
  ];

  // Style options
  const styleOptions = [
    { id: 'bold', label: 'Bold & Dramatic', preview: 'High contrast, vibrant colors' },
    { id: 'clean', label: 'Clean & Modern', preview: 'Minimalist, professional look' },
    { id: 'energetic', label: 'Energetic & Fun', preview: 'Bright, playful, dynamic' },
    { id: 'cinematic', label: 'Cinematic', preview: 'Movie-like, dramatic lighting' },
    { id: 'retro', label: 'Retro/Vintage', preview: 'Old-school, nostalgic feel' },
    { id: 'neon', label: 'Neon & Futuristic', preview: 'Cyberpunk, sci-fi vibes' }
  ];

  // Mood options
  const moodOptions = [
    { id: 'exciting', label: 'Exciting', icon: Zap, color: 'text-orange-500' },
    { id: 'professional', label: 'Professional', icon: Target, color: 'text-blue-500' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'text-green-500' },
    { id: 'community', label: 'Community', icon: Users, color: 'text-purple-500' },
    { id: 'urgent', label: 'Urgent/Breaking', icon: Clock, color: 'text-red-500' },
    { id: 'premium', label: 'Premium', icon: Star, color: 'text-yellow-500' }
  ];

  // Placement options
  const placementOptions = [
    { id: 'left', label: 'Left Side', preview: '👤 [TITLE TEXT]' },
    { id: 'right', label: 'Right Side', preview: '[TITLE TEXT] 👤' },
    { id: 'center', label: 'Center Focus', preview: '[TEXT] 👤 [TEXT]' },
    { id: 'corner', label: 'Corner Accent', preview: '[BIG TITLE] 👤' }
  ];

  // Image compression function
  const compressImage = (file, maxSizeMB = 1, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            // Check if compressed enough
            if (blob.size < maxSizeMB * 1024 * 1024) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              // Reduce quality further if still too large
              canvas.toBlob(
                (smallerBlob) => {
                  resolve(new File([smallerBlob], file.name, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                quality * 0.7
              );
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file) => {
    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      
      try {
        const fileSizeMB = file.size / 1024 / 1024;
        let processedFile = file;
        
        // Compress if larger than 1MB
        if (fileSizeMB > 1) {
          console.log('Compressing large image...');
          processedFile = await compressImage(file, 1, 0.8);
          console.log(`Compressed: ${fileSizeMB.toFixed(2)}MB → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage({
            file: processedFile,
            preview: e.target.result,
            name: file.name,
            originalSize: file.size,
            compressedSize: processedFile.size
          });
        };
        reader.readAsDataURL(processedFile);
        
      } catch (error) {
        console.error('Image processing failed:', error);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage({
            file,
            preview: e.target.result,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const downloadThumbnail = async (thumbnail) => {
    try {
      let blob = thumbnail.blob;
      
      if (!blob) {
        const response = await fetch(thumbnail.url);
        blob = await response.blob();
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-thumbnail-${thumbnail.style.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const downloadAllAsZip = async () => {
    if (generatedThumbnails.length === 0) return;
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder("youtube-thumbnails");
      
      const zipButton = document.querySelector('[data-zip-download]');
      if (zipButton) {
        zipButton.innerHTML = '<span class="animate-spin mr-2">⏳</span>Creating ZIP...';
        zipButton.disabled = true;
      }
      
      for (let i = 0; i < generatedThumbnails.length; i++) {
        const thumbnail = generatedThumbnails[i];
        let blob = thumbnail.blob;
        
        if (!blob) {
          try {
            const response = await fetch(thumbnail.url);
            blob = await response.blob();
          } catch (error) {
            console.error(`Failed to fetch thumbnail ${i + 1}:`, error);
            continue;
          }
        }
        
        const cleanStyleName = thumbnail.style
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        const filename = `thumbnail-${i + 1}-${cleanStyleName}.png`;
        folder.file(filename, blob);
      }
      
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-thumbnails-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to create ZIP file:', error);
      alert('Failed to create ZIP file. Please try downloading thumbnails individually.');
    } finally {
      const zipButton = document.querySelector('[data-zip-download]');
      if (zipButton) {
        zipButton.innerHTML = 'Download All as ZIP';
        zipButton.disabled = false;
      }
    }
  };

  const generateThumbnails = async () => {
    if (!profileImage) return;
  
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep(3);
  
    // Enhanced progress with realistic stages
    const progressStages = [
      { progress: 15, message: 'Analyzing your profile photo...', duration: 2000 },
      { progress: 30, message: 'Understanding your requirements...', duration: 8000 },
      { progress: 45, message: 'Creating thumbnail variation 1/3...', duration: 8000 },
      { progress: 65, message: 'Creating thumbnail variation 2/3...', duration: 8000 },
      { progress: 85, message: 'Creating thumbnail variation 3/3...', duration: 8000 },
      { progress: 95, message: 'Adding final touches...', duration: 2000 }
    ];
  
    let currentStageIndex = 0;
  
    const progressInterval = setInterval(() => {
      if (currentStageIndex < progressStages.length) {
        const stage = progressStages[currentStageIndex];
        setGenerationProgress(stage.progress);
        setCurrentMessage(stage.message);
        
        setTimeout(() => {
          currentStageIndex++;
        }, stage.duration);
      }
    }, 100);
  
    // Your existing API call code stays the same...
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', profileImage.file);
      formDataToSend.append('placement', formData.placement);
      formDataToSend.append('videoType', formData.videoType);
      formDataToSend.append('style', formData.style);
      formDataToSend.append('mood', formData.mood);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('additionalText', formData.additionalText);

      const response = await fetch('/api/generate-thumbnails', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();
      
      if (result.thumbnails && Array.isArray(result.thumbnails)) {
        const thumbnailsWithBlobs = await Promise.all(
          result.thumbnails.map(async (thumbnail, index) => {
            try {
              const imgResponse = await fetch(thumbnail);
              const blob = await imgResponse.blob();
              return {
                id: index + 1,
                url: thumbnail,
                blob: blob,
                style: thumbnail.style || `Variation ${index + 1}`,
                description: thumbnail.description || ''
              };
            } catch (error) {
              console.error('Error fetching thumbnail:', error);
              return {
                id: index + 1,
                url: thumbnail,
                blob: null,
                style: `Variation ${index + 1}`,
                description: ''
              };
            }
          })
        );
        setGeneratedThumbnails(thumbnailsWithBlobs);
      } else {
        const imgResponse = await fetch(result.generated_image);
        const blob = await imgResponse.blob();
        setGeneratedThumbnails([{
          id: 1,
          url: result.generated_image,
          blob: blob,
          style: 'Generated Thumbnail',
          description: result.description || ''
        }]);
      }
      
      setGenerationProgress(100);
      
    } catch (error) {
      console.error('Generation failed:', error);
      // Demo fallback
      const demoThumbnails = await Promise.all([
        {
          id: 1,
          url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
          style: 'Bold & Energetic',
          description: 'High contrast with vibrant colors'
        },
        {
          id: 2,
          url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=450&fit=crop',
          style: 'Clean & Professional', 
          description: 'Minimalist design with clear text'
        },
        {
          id: 3,
          url: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800&h=450&fit=crop',
          style: 'Cinematic',
          description: 'Movie-like dramatic effect'
        }
      ].map(async (thumbnail) => {
        try {
          const response = await fetch(thumbnail.url);
          const blob = await response.blob();
          return { ...thumbnail, blob };
        } catch (error) {
          return { ...thumbnail, blob: null };
        }
      }));
      
      setGeneratedThumbnails(demoThumbnails);
      setGenerationProgress(100);
    } finally {
      clearInterval(progressInterval);
      setCurrentMessage('');
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setProfileImage(null);
    setGeneratedThumbnails([]);
    setFormData({
      placement: 'right',
      videoType: '',
      style: '',
      mood: '',
      title: '',
      additionalText: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canProceedToStep2 = profileImage !== null;
  const canGenerateThumbnails = formData.videoType && formData.style && formData.mood && formData.title.trim();

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${isDark ? '#3b82f6' : '#60a5fa'} 0%, transparent 50%), 
                          radial-gradient(circle at 75% 75%, ${isDark ? '#1e40af' : '#f472b6'} 0%, transparent 50%)`,
          filter: 'blur(60px)'
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-red-600/20' : 'bg-red-600/20'} backdrop-blur-sm`}>
                <Play className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  YouTube Thumbnail Generator
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create eye-catching thumbnails that get clicks
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400' 
                  : 'bg-white/50 hover:bg-white/70 text-gray-700'
              } backdrop-blur-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Upload Photo', icon: User },
              { step: 2, label: 'Quick Setup', icon: Wand2 },
              { step: 3, label: 'Your Thumbnails', icon: Sparkles }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentStep >= step
                    ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-600/20 text-blue-600')
                    : (isDark ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-200/50 text-gray-400')
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </div>
                {index < 2 && (
                  <ChevronRight className={`w-5 h-5 mx-4 ${
                    currentStep > step 
                      ? (isDark ? 'text-blue-400' : 'text-blue-600') 
                      : (isDark ? 'text-gray-600' : 'text-gray-400')
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-6">
          
          {/* Step 1: Upload Profile Photo */}
          {currentStep === 1 && (
            <div className={`rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300 ${
              isDark 
                ? 'bg-gray-900/30 border-gray-700/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Upload Your Profile Photo
                </h2>
                <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  This will be featured in your YouTube thumbnail to build personal brand recognition
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {!profileImage ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
                      dragActive 
                        ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-500/10')
                        : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !isCompressing && fileInputRef.current?.click()}
                  >
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      {isCompressing ? (
                        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                      ) : (
                        <User className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {isCompressing ? 'Processing your image...' : 'Drop your profile photo here'}
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isCompressing 
                        ? 'Optimizing for best quality and performance'
                        : 'or click to browse files • PNG, JPG up to 10MB'
                      }
                    </p>
                    {!isCompressing && (
                      <div className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isDark 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}>
                        <Upload className="w-5 h-5 mr-2" />
                        Select Photo
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative mx-auto w-64 h-64">
                      <img 
                        src={profileImage.preview} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <button
                        onClick={() => setProfileImage(null)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Perfect! Ready to create your thumbnails?
                      </p>
                      {profileImage.compressedSize && profileImage.originalSize && (
                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Image optimized: {(profileImage.originalSize / 1024 / 1024).toFixed(2)}MB → {(profileImage.compressedSize / 1024 / 1024).toFixed(2)}MB
                        </p>
                      )}
                      <button
                        onClick={() => setCurrentStep(2)}
                        className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                          isDark 
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'
                        } transform hover:scale-105`}
                      >
                        Continue to Setup <ChevronRight className="w-5 h-5 ml-2 inline" />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isCompressing}
                />
              </div>
            </div>
          )}

          {/* Step 2: Questionnaire */}
          {currentStep === 2 && (
            <div className="space-y-8">
              
              {/* Photo Placement */}
              <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Where should we place your photo?
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {placementOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateFormData('placement', option.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.placement === option.id
                          ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-500/10')
                          : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                      }`}
                    >
                      <div className={`text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {option.label}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {option.preview}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Type */}
              <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  What type of video is this for?
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {videoTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => updateFormData('videoType', type.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.videoType === type.id
                            ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-500/10')
                            : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          formData.videoType === type.id 
                            ? (isDark ? 'text-blue-400' : 'text-blue-600')
                            : (isDark ? 'text-gray-400' : 'text-gray-500')
                        }`} />
                        <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {type.label}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {type.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style */}
              <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Choose your thumbnail style
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {styleOptions.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateFormData('style', style.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.style === style.id
                          ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-500/10')
                          : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                      }`}
                    >
                      <div className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {style.label}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {style.preview}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  What mood should your thumbnail convey?
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {moodOptions.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.id}
                        onClick={() => updateFormData('mood', mood.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.mood === mood.id
                            ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-500/10')
                            : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          formData.mood === mood.id 
                            ? (isDark ? 'text-blue-400' : 'text-blue-600')
                            : mood.color
                        }`} />
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {mood.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title and Additional Text */}
              <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  What's the main text for your thumbnail?
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Main Title (Required)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="e.g., INSANE NEW GAMING SETUP!"
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        isDark 
                          ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white/70 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                      } focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Additional Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.additionalText}
                      onChange={(e) => updateFormData('additionalText', e.target.value)}
                      placeholder="e.g., $10,000 BUDGET!"
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        isDark 
                          ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white/70 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                      } focus:outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 mr-2 inline" />
                  Back
                </button>

                <button
                  onClick={generateThumbnails}
                  disabled={!canGenerateThumbnails}
                  className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    canGenerateThumbnails
                      ? (isDark 
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-xl shadow-red-500/25' 
                          : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-xl shadow-red-500/25')
                      : (isDark ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                  } transform hover:scale-105 active:scale-95 disabled:transform-none`}
                >
                  <Sparkles className="w-6 h-6 mr-2 inline" />
                  Generate Thumbnails
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && (
            <div className="space-y-8">
              {isGenerating ? (
                <div className={`rounded-3xl p-12 backdrop-blur-xl border text-center ${
                  isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className={`absolute inset-0 rounded-full border-4 ${
                      isDark ? 'border-red-600' : 'border-red-600'
                    }`} 
                    style={{
                      background: `conic-gradient(${isDark ? '#dc2626' : '#dc2626'} ${generationProgress * 3.6}deg, transparent 0deg)`
                    }} />
                    <div className={`absolute inset-2 rounded-full ${isDark ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
                      <Sparkles className={`w-10 h-10 animate-pulse ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    </div>
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Creating Your YouTube Thumbnails...
                  </h3>
                  
                  <div className="mb-6">
                    <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {Math.round(generationProgress)}% complete
                    </p>
                    <p className={`text-base font-medium mb-3 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      {currentMessage}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      This usually takes 2-3 minutes • We're creating 3 unique variations for you
                    </p>
                  </div>

                  {/* Animated dots to show activity */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} 
                        style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} 
                        style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} 
                        style={{ animationDelay: '300ms' }}></div>
                  </div>

                  {/* Pro tip while waiting */}
                  <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-gray-800/40' : 'bg-blue-50/50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      💡 <strong>Pro Tip:</strong> While we're generating, consider what emotion you want viewers to feel when they see your thumbnail!
                    </p>
                  </div>
                </div>
              ) :  (
                <>
                  {/* Header */}
                  <div className={`rounded-3xl p-8 backdrop-blur-xl border text-center ${
                    isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
                  }`}>
                    <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Your YouTube Thumbnails Are Ready! 🎉
                    </h2>
                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      We've created {generatedThumbnails.length} variations based on your preferences
                    </p>
                    
                    {generatedThumbnails.length > 1 && (
                      <button
                        onClick={downloadAllAsZip}
                        data-zip-download
                        className={`px-6 py-3 rounded-xl font-medium transition-all mr-4 ${
                          isDark 
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30' 
                            : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-600 border border-purple-600/30'
                        }`}
                      >
                        <Archive className="w-5 h-5 mr-2 inline" />
                        Download All as ZIP
                      </button>
                    )}
                    
                    <button
                      onClick={resetForm}
                      className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                      }`}
                    >
                      Create New Thumbnails
                    </button>
                  </div>

                  {/* Generated Thumbnails Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {generatedThumbnails.map((thumbnail) => (
                      <div
                        key={thumbnail.id}
                        className={`rounded-2xl p-6 backdrop-blur-xl border transition-all ${
                          isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
                        }`}
                      >
                        <div className="relative mb-4 group">
                          <img 
                            src={thumbnail.url} 
                            alt={thumbnail.style} 
                            className="w-full h-48 object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setPreviewImage(thumbnail);
                                  setShowPreview(true);
                                }}
                                className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => downloadThumbnail(thumbnail)}
                                className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute top-3 right-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isDark ? 'bg-green-600/90 text-white' : 'bg-green-500/90 text-white'
                            }`}>
                              <Check className="w-3 h-3 inline mr-1" />
                              Ready
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {thumbnail.style}
                            </h4>
                            {thumbnail.description && (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {thumbnail.description}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => downloadThumbnail(thumbnail)}
                            className={`w-full p-3 rounded-xl font-medium transition-all duration-300 ${
                              isDark 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                            } transform hover:scale-105 active:scale-95`}
                          >
                            <Download className="w-4 h-4 mr-2 inline" />
                            Download Thumbnail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips Section */}
                  <div className={`rounded-3xl p-8 backdrop-blur-xl border ${
                    isDark ? 'bg-gray-900/30 border-gray-700/30' : 'bg-white/50 border-gray-200/30'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      💡 Pro Tips for YouTube Success
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                      <strong className={isDark ? 'text-blue-400' : 'text-blue-600'}>A/B Test:</strong>
                       <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                         Try different thumbnails and see which gets more clicks!
                       </p>
                     </div>
                     <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                       <strong className={isDark ? 'text-green-400' : 'text-green-600'}>High Contrast:</strong>
                       <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                         Bold, readable text performs better on mobile devices.
                       </p>
                     </div>
                     <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                       <strong className={isDark ? 'text-purple-400' : 'text-purple-600'}>Face Forward:</strong>
                       <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                         Faces looking at the camera create stronger connections.
                       </p>
                     </div>
                     <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                       <strong className={isDark ? 'text-red-400' : 'text-red-600'}>Emotion Wins:</strong>
                       <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                         Express clear emotions - surprise, excitement, curiosity!
                       </p>
                     </div>
                   </div>
                 </div>
               </>
             )}
           </div>
         )}
       </main>
     </div>

     {/* Preview Modal */}
     {showPreview && previewImage && (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="relative max-w-4xl max-h-full">
           <button
             onClick={() => setShowPreview(false)}
             className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
           <img 
             src={previewImage.url} 
             alt="Preview" 
             className="max-w-full max-h-full object-contain rounded-2xl"
           />
           <div className="absolute bottom-4 left-4 right-4 text-center">
             <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
               <h4 className="text-white font-semibold mb-1">{previewImage.style}</h4>
               {previewImage.description && (
                 <p className="text-gray-300 text-sm">{previewImage.description}</p>
               )}
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}