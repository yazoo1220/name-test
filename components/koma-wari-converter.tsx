'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Settings, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface Panel {
  Content: string
  Shot: string
  Aim: string
  Prompt: string
  Dialogue: string
  Attribute: string
  Emotion: number
}

interface Page {
  page: number
  num_of_panels: number
  panels: Panel[]
}

interface ChartData {
  name: string
  emotion: number
  content: string
  attribute: string
}

const attributeColors = {
  'ヒキ': '#FF6B6B',
  'メクリ': '#4ECDC4',
  'キメ': '#45B7D1',
  'フリ': '#A9A9A9',
  'ウケ': '#5D5D5D',
  '': '#F0F0F0',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded shadow">
        <p className="font-bold">{label}</p>
        <p>感情: {payload[0].value}</p>
        <p>内容: {payload[0].payload.content}</p>
        <p>属性: {payload[0].payload.attribute || 'なし'}</p>
      </div>
    );
  }
  return null;
};

export function KomaWariConverterComponent() {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Page[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [width, setWidth] = useState(960)
  const [height, setHeight] = useState(1280)
  const [storyAdaptationApiKey, setStoryAdaptationApiKey] = useState('')
  const [punchlineCreationApiKey, setPunchlineCreationApiKey] = useState('')
  const [comicStripApiKey, setComicStripApiKey] = useState('')
  const { toast } = useToast()

  // Story Adaptation state
  const [original, setOriginal] = useState('')
  const [theme, setTheme] = useState('')
  const [world, setWorld] = useState('')
  const [instruction, setInstruction] = useState('')
  const [storyAdaptationOutput, setStoryAdaptationOutput] = useState('')

  // Punchline Creation state
  const [character, setCharacter] = useState('')
  const [setup, setSetup] = useState('')
  const [reaction, setReaction] = useState('')
  const [direction, setDirection] = useState('')
  const [numOfResults, setNumOfResults] = useState(1)
  const [punchlineCreationOutput, setPunchlineCreationOutput] = useState('')

  // Comic Strip Creation state
  const [scenario, setScenario] = useState('')
  const [comicStripOutput, setComicStripOutput] = useState('')

  // API Error state
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const jsonData: Page[] = JSON.parse(jsonInput)
      setPreview(jsonData)
      setError('')

      const newChartData: ChartData[] = []
      jsonData.forEach((page, pageIndex) => {
        page.panels.forEach((panel, panelIndex) => {
          newChartData.push({
            name: `P${page.page}-${panelIndex + 1}`,
            emotion: panel.Emotion,
            content: panel.Content,
            attribute: panel.Attribute
          })
        })
      })
      setChartData(newChartData)
    } catch (err) {
      if (jsonInput.trim() !== '') {
        setError('無効なJSON入力です。JSONを確認して再試行してください。')
      }
      setPreview([])
      setChartData([])
    }
  }, [jsonInput])

  const handleDifyRequest = async (apiKey: string, inputs: any, setOutput: (output: string) => void) => {
    const url = "https://api.dify.ai/v1/completion-messages"
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
    const data = {
      inputs,
      "response_mode": "blocking",
      "user": "user-1"
    }

    console.log('Request URL:', url);
    console.log('Request Headers:', headers);
    console.log('Request Data:', data);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      })

      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      const responseData = await response.json();
      console.log('Response Data:', responseData);

      if (response.ok) {
        setOutput(responseData.answer)
        setApiError(null)
        toast({
          title: "生成完了",
          description: "Difyからの応答を受信しました。",
        })
      } else {
        throw new Error(`Error ${response.status}: ${responseData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Dify API request failed:', error)
      const errorMessage = error.response ? `${error.message}: ${JSON.stringify(error.response.data)}` : error.message;
      setApiError(errorMessage);
      toast({
        title: "APIリクエストエラー",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleStoryAdaptation = () => {
    handleDifyRequest(storyAdaptationApiKey, { original, theme, world, instruction }, setStoryAdaptationOutput)
  }

  const handlePunchlineCreation = () => {
    handleDifyRequest(punchlineCreationApiKey, { character, setup, reaction, direction, num_of_results: numOfResults }, setPunchlineCreationOutput)
  }

  const handleComicStripCreation = () => {
    handleDifyRequest(comicStripApiKey, { scenario }, setComicStripOutput)
  }

  const pasteToConverter = (output: string) => {
    setJsonInput(output)
  }

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">コマ割りコンバーター</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>設定</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="width" className="text-right">
                  幅
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="height" className="text-right">
                  高さ
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="storyAdaptationApiKey" className="text-right">
                  ストーリー転用 API Key
                </Label>
                <Input
                  id="storyAdaptationApiKey"
                  type="password"
                  value={storyAdaptationApiKey}
                  onChange={(e) => setStoryAdaptationApiKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="punchlineCreationApiKey" className="text-right">
                  オチ作成 API Key
                </Label>
                <Input
                  id="punchlineCreationApiKey"
                  type="password"
                  value={punchlineCreationApiKey}
                  onChange={(e) => setPunchlineCreationApiKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comicStripApiKey" className="text-right">
                  コマ割り作成 API Key
                </Label>
                <Input
                  id="comicStripApiKey"
                  type="password"
                  value={comicStripApiKey}
                  onChange={(e) => setComicStripApiKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertTitle>APIエラー</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="story-adaptation" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="story-adaptation">ストーリー転用</TabsTrigger>
          <TabsTrigger value="punchline-creation">オチ作成</TabsTrigger>
          <TabsTrigger value="comic-strip">コマ割り</TabsTrigger>
          <TabsTrigger value="analysis">分析</TabsTrigger>
        </TabsList>
        <TabsContent value="story-adaptation" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>ストーリー転用</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="original">元ネタ</Label>
                <Textarea
                  id="original"
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="元ネタを入力してください..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">テーマ</Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="テーマを入力してください..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="world">世界観</Label>
                <Input
                  id="world"
                  value={world}
                  onChange={(e) => setWorld(e.target.value)}
                  placeholder="世界観を入力してください..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instruction">追加指示</Label>
                <Textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="追加指示を入力してください..."
                  rows={3}
                />
              </div>
              <Button onClick={handleStoryAdaptation}>生成</Button>
              {storyAdaptationOutput && (
                <div className="space-y-2">
                  <h4 className="font-semibold">出力結果:</h4>
                  <Textarea value={storyAdaptationOutput} readOnly rows={6} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="punchline-creation" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>オチ作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="character">キャラ</Label>
                <Input
                  id="character"
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="キャラを入力してください..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup">フリ</Label>
                <Textarea
                  id="setup"
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  placeholder="フリを入力してください..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reaction">ツッコミ</Label>
                <Textarea
                  id="reaction"
                  value={reaction}
                  onChange={(e) => setReaction(e.target.value)}
                  placeholder="ツッコミを入力してください..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direction">オチの方向性</Label>
                <select
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="誇張">誇張</option>
                  <option value="エロ">エロ</option>
                  <option value="勘違い">勘違い</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numOfResults">出力数</Label>
                <Input
                  id="numOfResults"
                  type="number"
                  min={1}
                  max={10}
                  value={numOfResults}
                  onChange={(e) => setNumOfResults(Number(e.target.value))}
                />
              </div>
              <Button onClick={handlePunchlineCreation}>生成</Button>
              {punchlineCreationOutput && (
                <div className="space-y-2">
                  <h4 className="font-semibold">出力結果:</h4>
                  <Textarea value={punchlineCreationOutput} readOnly rows={6} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comic-strip" className="w-full">
          <div className="space-y-4 md:flex md:space-x-4 md:space-y-0">
            <Card className="md:w-1/2">
              <CardHeader>
                <CardTitle>コマ割り作成</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario">シナリオ</Label>
                  <Textarea
                    id="scenario"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="シナリオを入力してください..."
                    rows={6}
                  />
                </div>
                <Button onClick={handleComicStripCreation}>コマ割り生成</Button>
                {comicStripOutput && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">出力結果:</h4>
                    <Textarea value={comicStripOutput} readOnly rows={6} />
                    <Button onClick={() => pasteToConverter(comicStripOutput)} variant="outline">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      プレビューに反映
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:w-1/2">
              <CardHeader>
                <CardTitle>プレビュー</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview.map((page) => (
                  <Card key={page.page}>
                    <CardHeader>
                      <CardTitle>ページ {page.page}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>コマ数: {page.num_of_panels}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {page.panels.map((panel, index) => (
                          <div key={index} className="p-4 border rounded">
                            <h3 className="font-bold">コマ {index + 1}</h3>
                            <p><strong>内容:</strong> {panel.Content}</p>
                            <p><strong>ショット:</strong> {panel.Shot}</p>
                            <p><strong>目的:</strong> {panel.Aim}</p>
                            <p><strong>セリフ:</strong> {panel.Dialogue}</p>
                            <p><strong>属性:</strong> {panel.Attribute || 'なし'}</p>
                            <p><strong>感情:</strong> {panel.Emotion}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analysis" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>感情チャート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={20} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="emotion">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={attributeColors[entry.attribute as keyof typeof attributeColors] || attributeColors['']} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}