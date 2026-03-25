import { useState, useRef, useEffect } from 'react';
import { 
  Mic, Play, Pause, Square, Settings, Volume2, 
  Trash2, Loader2, CheckCircle, AlertCircle,
  Brain, Speaker, Music, Wand2, Languages, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface VoiceRecording {
  id: string;
  name: string;
  duration: number;
  transcript: string;
  timestamp: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
}

interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  preview?: string;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
}

const mockTTSVoices: TTSVoice[] = [
  { id: 'en-US-Standard-A', name: 'US English (Standard)', language: 'en-US', gender: 'male' },
  { id: 'en-US-Standard-B', name: 'US English (Standard)', language: 'en-US', gender: 'female' },
  { id: 'en-GB-Standard-A', name: 'UK English (Standard)', language: 'en-GB', gender: 'female' },
  { id: 'en-AU-Standard-A', name: 'Australian English', language: 'en-AU', gender: 'female' },
  { id: 'es-ES-Standard-A', name: 'Spanish (Spain)', language: 'es-ES', gender: 'female' },
  { id: 'fr-FR-Standard-A', name: 'French (France)', language: 'fr-FR', gender: 'female' },
  { id: 'de-DE-Standard-A', name: 'German', language: 'de-DE', gender: 'female' },
  { id: 'ja-JP-Standard-A', name: 'Japanese', language: 'ja-JP', gender: 'female' },
  { id: 'zh-CN-Standard-A', name: 'Chinese (Mandarin)', language: 'zh-CN', gender: 'female' },
];

const mockElevenLabsVoices: ElevenLabsVoice[] = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', description: 'Calm and soothing female voice' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', description: 'Strong and energetic female voice' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade', description: 'Soft and gentle female voice' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', description: 'Warm and friendly male voice' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade', description: 'Casual and conversational female voice' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade', description: 'Young and energetic male voice' },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade', description: 'Deep and authoritative male voice' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade', description: 'Professional and clear male voice' },
];

export function VoicePage() {
  // Whisper STT State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<VoiceRecording | null>(null);
  const [whisperConfig, setWhisperConfig] = useState({
    model: 'whisper-1',
    language: 'auto',
    prompt: '',
    temperature: 0.0,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('Welcome to ClawCommand. Your voice-enabled agent control center.');
  const [selectedTTSVoice, setSelectedTTSVoice] = useState(mockTTSVoices[0].id);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsHistory, setTtsHistory] = useState<{id: string; text: string; voice: string; timestamp: string}[]>([]);

  // ElevenLabs State
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [selectedElevenVoice, setSelectedElevenVoice] = useState(mockElevenLabsVoices[0].voice_id);
  const [elevenLabsStability, setElevenLabsStability] = useState(0.5);
  const [elevenLabsClarity, setElevenLabsClarity] = useState(0.75);
  const [elevenLabsStyle, setElevenLabsStyle] = useState(0.0);
  const [isElevenLabsConfigured, setIsElevenLabsConfigured] = useState(false);
  const [showElevenConfig, setShowElevenConfig] = useState(false);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Whisper STT Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      toast.info('Recording started...');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.info('Processing audio...');
    }
  };

  const processRecording = async (_audioBlob: Blob) => {
    const newRecording: VoiceRecording = {
      id: Date.now().toString(),
      name: `Recording ${recordings.length + 1}`,
      duration: recordingTime,
      transcript: '',
      timestamp: new Date().toISOString(),
      status: 'processing',
    };

    setRecordings(prev => [newRecording, ...prev]);

    // Simulate Whisper API processing
    setTimeout(() => {
      setRecordings(prev => 
        prev.map(r => 
          r.id === newRecording.id 
            ? { ...r, status: 'completed', transcript: 'This is a simulated transcription from Whisper STT. In production, this would be the actual transcribed text from your audio recording.' }
            : r
        )
      );
      toast.success('Transcription complete!');
    }, 2000);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    if (selectedRecording?.id === id) {
      setSelectedRecording(null);
    }
    toast.success('Recording deleted');
  };

  // TTS Functions
  const playTTS = () => {
    if (!ttsText.trim()) {
      toast.error('Please enter text to speak');
      return;
    }

    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(ttsText);
      const voice = mockTTSVoices.find(v => v.id === selectedTTSVoice);
      
      utterance.rate = ttsSpeed;
      utterance.pitch = ttsPitch;
      
      // Try to find matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(voice?.language || 'en'));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        // Add to history
        setTtsHistory(prev => [{
          id: Date.now().toString(),
          text: ttsText,
          voice: voice?.name || 'Default',
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 10));
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        toast.error('TTS playback failed');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // ElevenLabs Functions
  const saveElevenLabsConfig = () => {
    if (!elevenLabsKey.trim()) {
      toast.error('Please enter your ElevenLabs API key');
      return;
    }
    setIsElevenLabsConfigured(true);
    setShowElevenConfig(false);
    toast.success('ElevenLabs configuration saved');
  };

  const playElevenLabsTTS = async () => {
    if (!isElevenLabsConfigured) {
      setShowElevenConfig(true);
      return;
    }

    if (!ttsText.trim()) {
      toast.error('Please enter text to speak');
      return;
    }

    toast.info('Generating speech with ElevenLabs...');
    
    // Simulate ElevenLabs API call
    setTimeout(() => {
      toast.success('Speech generated! (Simulated - connect API for real audio)');
      setTtsHistory(prev => [{
        id: Date.now().toString(),
        text: ttsText,
        voice: mockElevenLabsVoices.find(v => v.voice_id === selectedElevenVoice)?.name || 'ElevenLabs',
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 10));
    }, 1500);
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Voice Integration</h1>
            <p className="text-slate-400">Whisper STT, TTS, and ElevenLabs voice synthesis</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="whisper" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="whisper" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Mic className="w-4 h-4 mr-2" />
            Whisper STT
          </TabsTrigger>
          <TabsTrigger value="tts" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Speaker className="w-4 h-4 mr-2" />
            Text-to-Speech
          </TabsTrigger>
          <TabsTrigger value="elevenlabs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Music className="w-4 h-4 mr-2" />
            ElevenLabs
          </TabsTrigger>
        </TabsList>

        {/* Whisper STT Tab */}
        <TabsContent value="whisper" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recording Panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-cyan-400" />
                    Voice Recorder
                  </CardTitle>
                  <CardDescription>Record audio and transcribe with Whisper</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recording Visualizer */}
                  <div className="relative h-48 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center gap-1">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 rounded-full transition-all duration-150 ${
                            isRecording ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                          }`}
                          style={{
                            height: isRecording 
                              ? `${20 + Math.random() * 60}%` 
                              : '20%',
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                    {isRecording && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    {!isRecording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={stopRecording}
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recordings List */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recordings</CardTitle>
                  <CardDescription>{recordings.length} recordings saved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recordings.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recordings yet</p>
                        <p className="text-sm">Start recording to transcribe audio</p>
                      </div>
                    ) : (
                      recordings.map((recording) => (
                        <div
                          key={recording.id}
                          onClick={() => setSelectedRecording(recording)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedRecording?.id === recording.id
                              ? 'bg-cyan-500/10 border-cyan-500/50'
                              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                {recording.status === 'processing' ? (
                                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                ) : recording.status === 'completed' ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                  <Mic className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{recording.name}</p>
                                <p className="text-sm text-slate-400">
                                  {formatTime(recording.duration)} • {new Date(recording.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={recording.status === 'completed' ? 'default' : 'secondary'}>
                                {recording.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRecording(recording.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                          {recording.transcript && (
                            <div className="mt-3 p-3 bg-slate-950/50 rounded-lg">
                              <p className="text-sm text-slate-300">{recording.transcript}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Panel */}
            <Card className="bg-slate-900/50 border-slate-800 h-fit">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Whisper Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select 
                    value={whisperConfig.model} 
                    onValueChange={(v) => setWhisperConfig(prev => ({ ...prev, model: v }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-1">whisper-1</SelectItem>
                      <SelectItem value="whisper-large-v3">whisper-large-v3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={whisperConfig.language} 
                    onValueChange={(v) => setWhisperConfig(prev => ({ ...prev, language: v }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature ({whisperConfig.temperature})</Label>
                  <Slider
                    value={[whisperConfig.temperature * 100]}
                    onValueChange={([v]) => setWhisperConfig(prev => ({ ...prev, temperature: v / 100 }))}
                    max={100}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt (Optional)</Label>
                  <Input
                    value={whisperConfig.prompt}
                    onChange={(e) => setWhisperConfig(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Context for transcription..."
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Brain className="w-4 h-4" />
                    <span>Powered by OpenAI Whisper</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TTS Tab */}
        <TabsContent value="tts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Speaker className="w-5 h-5 text-cyan-400" />
                  Text-to-Speech
                </CardTitle>
                <CardDescription>Convert text to speech using browser voices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Text to Speak</Label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Enter text to convert to speech..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={selectedTTSVoice} onValueChange={setSelectedTTSVoice}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTTSVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name} ({voice.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Speed ({ttsSpeed}x)</Label>
                    <Slider
                      value={[ttsSpeed * 100]}
                      onValueChange={([v]) => setTtsSpeed(v / 100)}
                      min={50}
                      max={200}
                      step={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pitch ({ttsPitch}x)</Label>
                    <Slider
                      value={[ttsPitch * 100]}
                      onValueChange={([v]) => setTtsPitch(v / 100)}
                      min={50}
                      max={200}
                      step={10}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={playTTS}
                    disabled={isPlaying}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? 'Playing...' : 'Play'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopTTS}
                    disabled={!isPlaying}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ttsHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Speaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No TTS history yet</p>
                    </div>
                  ) : (
                    ttsHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <p className="text-sm text-slate-300 line-clamp-2">{item.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">{item.voice}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ElevenLabs Tab */}
        <TabsContent value="elevenlabs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-cyan-400" />
                        ElevenLabs Voice Synthesis
                      </CardTitle>
                      <CardDescription>Premium AI voices with emotion control</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowElevenConfig(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isElevenLabsConfigured ? 'Configured' : 'Configure'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isElevenLabsConfigured && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-amber-400 font-medium">API Key Required</p>
                        <p className="text-sm text-amber-400/70">Configure your ElevenLabs API key to use premium voices</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select value={selectedElevenVoice} onValueChange={setSelectedElevenVoice}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockElevenLabsVoices.map((voice) => (
                          <SelectItem key={voice.voice_id} value={voice.voice_id}>
                            {voice.name} - {voice.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Text to Synthesize</Label>
                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      placeholder="Enter text for ElevenLabs synthesis..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Stability</Label>
                        <span className="text-sm text-slate-400">{elevenLabsStability}</span>
                      </div>
                      <Slider
                        value={[elevenLabsStability * 100]}
                        onValueChange={([v]) => setElevenLabsStability(v / 100)}
                        max={100}
                      />
                      <p className="text-xs text-slate-500">Higher values make voice more consistent</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Clarity + Similarity</Label>
                        <span className="text-sm text-slate-400">{elevenLabsClarity}</span>
                      </div>
                      <Slider
                        value={[elevenLabsClarity * 100]}
                        onValueChange={([v]) => setElevenLabsClarity(v / 100)}
                        max={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Style Exaggeration</Label>
                        <span className="text-sm text-slate-400">{elevenLabsStyle}</span>
                      </div>
                      <Slider
                        value={[elevenLabsStyle * 100]}
                        onValueChange={([v]) => setElevenLabsStyle(v / 100)}
                        max={100}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={playElevenLabsTTS}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with ElevenLabs
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 h-fit">
              <CardHeader>
                <CardTitle className="text-white">Voice Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Languages className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">29 Languages</p>
                      <p className="text-sm text-slate-400">Support for major world languages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Voice Cloning</p>
                      <p className="text-sm text-slate-400">Clone any voice with 1 minute of audio</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">High Quality</p>
                      <p className="text-sm text-slate-400">Studio-grade voice synthesis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ElevenLabs Config Dialog */}
      <Dialog open={showElevenConfig} onOpenChange={setShowElevenConfig}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>ElevenLabs Configuration</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your ElevenLabs API key to enable premium voice synthesis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder="sk_..."
                className="bg-slate-800 border-slate-700"
              />
              <p className="text-xs text-slate-500">
                Get your API key from{' '}
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  elevenlabs.io
                </a>
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowElevenConfig(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveElevenLabsConfig} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VoicePage;
