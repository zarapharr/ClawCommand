import { useState } from 'react';
import type { Skill } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, Search, Plus, Edit2, Trash2, Play, Globe, 
  Code, Terminal, Sparkles
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
    ));
  };

  const handleDelete = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    if (selectedSkill?.id === id) setSelectedSkill(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-purple-400">Skills</span> Forge
            </h1>
            <p className="text-xs text-slate-400">Build and manage agent skills</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Create Skill
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Skills List */}
        <div className="w-80 border-r border-slate-800/50 flex flex-col">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-slate-900/50">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">All</TabsTrigger>
              <TabsTrigger value="local" className="text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Local</TabsTrigger>
              <TabsTrigger value="clawhub" className="text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">ClawHub</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-2 space-y-1">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                        'hover:bg-slate-800/50',
                        selectedSkill?.id === skill.id && 'bg-purple-500/10 border border-purple-500/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                        {skill.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{skill.name}</p>
                          {!skill.isLocal && <Globe className="w-3 h-3 text-slate-500" />}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{skill.description}</p>
                      </div>
                      <Switch 
                        checked={skill.isEnabled} 
                        onCheckedChange={() => handleToggle(skill.id)}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="local" className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-2 space-y-1">
                  {filteredSkills.filter(s => s.isLocal).map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                        'hover:bg-slate-800/50',
                        selectedSkill?.id === skill.id && 'bg-purple-500/10 border border-purple-500/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                        {skill.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white">{skill.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{skill.description}</p>
                      </div>
                      <Switch 
                        checked={skill.isEnabled} 
                        onCheckedChange={() => handleToggle(skill.id)}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="clawhub" className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-2 space-y-1">
                  {filteredSkills.filter(s => !s.isLocal).map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                        'hover:bg-slate-800/50',
                        selectedSkill?.id === skill.id && 'bg-purple-500/10 border border-purple-500/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                        {skill.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white">{skill.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{skill.description}</p>
                      </div>
                      <Switch 
                        checked={skill.isEnabled} 
                        onCheckedChange={() => handleToggle(skill.id)}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Skill Detail */}
        <div className="flex-1 overflow-auto p-6">
          {selectedSkill ? (
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
                    {selectedSkill.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{selectedSkill.name}</h2>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                        v{selectedSkill.version}
                      </Badge>
                      {!selectedSkill.isLocal && (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                          <Globe className="w-3 h-3 mr-1" />
                          ClawHub
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400">{selectedSkill.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">by {selectedSkill.author}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                    <Play className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsEditing(!isEditing)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(selectedSkill.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="builder" className="w-full">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                  <TabsTrigger value="builder" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Visual Builder
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    <Code className="w-4 h-4 mr-2" />
                    Code Editor
                  </TabsTrigger>
                  <TabsTrigger value="config" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    <Terminal className="w-4 h-4 mr-2" />
                    Configuration
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="mt-6">
                  <div className="holo-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Skill Builder</h3>
                    
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Trigger</p>
                            <p className="text-xs text-slate-400">How this skill is activated</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-11">
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                            {selectedSkill.trigger.type}
                          </Badge>
                          <span className="text-sm text-white">{selectedSkill.trigger.value}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Parameters</p>
                            <p className="text-xs text-slate-400">Input parameters for this skill</p>
                          </div>
                        </div>
                        <div className="ml-11 space-y-2">
                          {selectedSkill.parameters.map((param) => (
                            <div key={param.name} className="flex items-center gap-2">
                              <span className="text-sm text-cyan-400">{param.name}</span>
                              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                {param.type}
                              </Badge>
                              {param.required && (
                                <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                                  required
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500">- {param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Code className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Handler</p>
                            <p className="text-xs text-slate-400">The code that runs when triggered</p>
                          </div>
                        </div>
                        <div className="ml-11">
                          <pre className="p-3 rounded-lg bg-slate-950 text-xs text-slate-300 overflow-x-auto">
                            {selectedSkill.handler}
                          </pre>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Examples</p>
                            <p className="text-xs text-slate-400">Usage examples</p>
                          </div>
                        </div>
                        <div className="ml-11 space-y-2">
                          {selectedSkill.examples.map((example, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{idx + 1}.</span>
                              <code className="text-sm text-cyan-400">{example}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-6">
                  <div className="holo-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Code Editor</h3>
                    <pre className="p-4 rounded-lg bg-slate-950 text-sm text-slate-300 overflow-x-auto font-mono">
                      {`// ${selectedSkill.name}
// ${selectedSkill.description}

export const ${selectedSkill.id} = {
  name: '${selectedSkill.name}',
  description: '${selectedSkill.description}',
  trigger: {
    type: '${selectedSkill.trigger.type}',
    value: '${selectedSkill.trigger.value}'
  },
  parameters: ${JSON.stringify(selectedSkill.parameters, null, 2)},
  handler: async (params) => {
    ${selectedSkill.handler}
  }
};`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="mt-6">
                  <div className="holo-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Skill ID</label>
                        <Input value={selectedSkill.id} className="bg-slate-900/50 border-slate-700 text-white" readOnly />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Version</label>
                        <Input value={selectedSkill.version} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Author</label>
                        <Input value={selectedSkill.author} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Icon</label>
                        <Input value={selectedSkill.icon} className="bg-slate-900/50 border-slate-700 text-white w-20 text-center" readOnly={!isEditing} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Wrench className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Select a skill to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
