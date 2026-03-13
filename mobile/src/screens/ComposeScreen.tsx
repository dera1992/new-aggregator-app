import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { OptionGroup } from "@/components/OptionGroup";
import { ErrorState } from "@/components/ErrorState";
import { ShareActions } from "@/components/ShareActions";
import { Accordion } from "@/components/Accordion";
import {
  generateSummaryFromText,
  generateAnalysisFromText,
  generateJokeFromText,
  generateViralPostFromText,
  generateCommentFromText,
  generatePerspectiveFromText,
  extractUrlText,
} from "@/lib/api/compose";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";
import type {
  ViralPostResponse,
  CommentResponse,
  GenerateAnalysisResponse,
  GenerateJokeResponse,
} from "@/types/news";
import type { PerspectiveResponse } from "@/lib/api/news";

type ComposeAction = "summary" | "analysis" | "joke" | "viral" | "comment" | "perspective";

type ComposeResult =
  | { type: "summary"; data: { summary: string; warnings: string[] } }
  | { type: "analysis"; data: GenerateAnalysisResponse }
  | { type: "joke"; data: GenerateJokeResponse }
  | { type: "viral"; data: ViralPostResponse }
  | { type: "comment"; data: CommentResponse }
  | { type: "perspective"; data: PerspectiveResponse };

const ACTION_LABELS: Record<ComposeAction, string> = {
  summary: "Summary",
  analysis: "Analysis",
  joke: "Joke",
  viral: "Viral Post",
  comment: "Comment",
  perspective: "Perspective",
};

export function ComposeScreen() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [text, setText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [action, setAction] = useState<ComposeAction>("summary");
  const [result, setResult] = useState<ComposeResult | null>(null);

  const [summaryStyle, setSummaryStyle] = useState<"short" | "standard" | "detailed">("standard");
  const [analysisTone, setAnalysisTone] = useState("insightful");
  const [analysisFormat, setAnalysisFormat] = useState("standard");
  const [jokeStyle, setJokeStyle] = useState("one_liner");
  const [viralPlatform, setViralPlatform] = useState("twitter");
  const [commentPlatform, setCommentPlatform] = useState("General");
  const [commentStyle, setCommentStyle] = useState("curious");
  const [perspectiveTone, setPerspectiveTone] = useState<"neutral" | "genz" | "professional">("neutral");
  const [perspectiveSlang, setPerspectiveSlang] = useState<"none" | "light" | "heavy">("none");

  const charCount = text.trim().length;
  const canGenerate = charCount >= 50;

  const urlMutation = useMutation({
    mutationFn: (url: string) => extractUrlText(url),
    onSuccess: (data) => { setText(data.text); setUrlInput(""); },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      switch (action) {
        case "summary":
          return { type: "summary" as const, data: await generateSummaryFromText({ text, style: summaryStyle }) };
        case "analysis":
          return { type: "analysis" as const, data: await generateAnalysisFromText({ text, format: analysisFormat, tone: analysisTone }) };
        case "joke":
          return { type: "joke" as const, data: await generateJokeFromText({ text, style: jokeStyle, max_variants: 2 }) };
        case "viral":
          return { type: "viral" as const, data: await generateViralPostFromText({ text, platform: viralPlatform, tone: "punchy", goal: "engagement", audience: "general", brand_voice: "confident", max_variants: 2 }) };
        case "comment":
          return { type: "comment" as const, data: await generateCommentFromText({ text, platform: commentPlatform, style: commentStyle, audience: "general", max_variants: 2 }) };
        case "perspective":
          return { type: "perspective" as const, data: await generatePerspectiveFromText({ text, tone: perspectiveTone, slang_level: perspectiveSlang }) };
      }
    },
    onSuccess: (data) => setResult(data as ComposeResult),
  });

  const handlePasteClipboard = async () => {
    const content = await Clipboard.getStringAsync();
    if (content) setText(content);
  };

  return (
    <Screen>
      <View style={styles.container}>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Content</Text>
          <TextInput
            style={[styles.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={text}
            onChangeText={setText}
            placeholder="Paste article text here (min 50 characters)..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: charCount >= 50 ? theme.colors.textMuted : theme.colors.primary }]}>
            {charCount < 50 ? `${50 - charCount} more characters needed` : `${charCount} characters`}
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input placeholder="Article or YouTube URL" value={urlInput} onChangeText={setUrlInput} />
            </View>
            <Button label={urlMutation.isPending ? "..." : "Import"} variant="secondary" onPress={() => { if (urlInput.trim()) urlMutation.mutate(urlInput.trim()); }} />
          </View>
          {urlMutation.error ? <ErrorState message={(urlMutation.error as Error).message} /> : null}
          <View style={styles.row}>
            <Button label="Paste clipboard" variant="outline" onPress={handlePasteClipboard} />
            <Button label="Clear" variant="ghost" onPress={() => { setText(""); setResult(null); }} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Action</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
            {(Object.keys(ACTION_LABELS) as ComposeAction[]).map((a) => (
              <Button key={a} label={ACTION_LABELS[a]} variant={action === a ? "secondary" : "ghost"} onPress={() => { setAction(a); setResult(null); }} />
            ))}
          </ScrollView>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Options</Text>
          {action === "summary" && (
            <OptionGroup label="Style" options={[{ label: "Short", value: "short" }, { label: "Standard", value: "standard" }, { label: "Detailed", value: "detailed" }]} value={summaryStyle} onChange={setSummaryStyle} />
          )}
          {action === "analysis" && (
            <View style={{ gap: 12 }}>
              <OptionGroup label="Format" options={[{ label: "Brief", value: "brief" }, { label: "Standard", value: "standard" }, { label: "Deep", value: "deep" }]} value={analysisFormat} onChange={setAnalysisFormat} />
              <OptionGroup label="Tone" options={[{ label: "Neutral", value: "neutral" }, { label: "Insightful", value: "insightful" }, { label: "Skeptical", value: "skeptical" }, { label: "Optimistic", value: "optimistic" }]} value={analysisTone} onChange={setAnalysisTone} />
            </View>
          )}
          {action === "joke" && (
            <OptionGroup label="Style" options={[{ label: "One liner", value: "one_liner" }, { label: "Pun", value: "pun" }, { label: "Observational", value: "observational" }, { label: "Satire", value: "satire_light" }, { label: "Dad joke", value: "dad_joke" }]} value={jokeStyle} onChange={setJokeStyle} />
          )}
          {action === "viral" && (
            <OptionGroup label="Platform" options={[{ label: "Twitter / X", value: "twitter" }, { label: "LinkedIn", value: "linkedin" }, { label: "Instagram", value: "instagram" }]} value={viralPlatform} onChange={setViralPlatform} />
          )}
          {action === "comment" && (
            <View style={{ gap: 12 }}>
              <OptionGroup label="Platform" options={[{ label: "General", value: "General" }, { label: "Twitter", value: "Twitter" }, { label: "LinkedIn", value: "LinkedIn" }, { label: "Reddit", value: "Reddit" }]} value={commentPlatform} onChange={setCommentPlatform} />
              <OptionGroup label="Style" options={[{ label: "Curious", value: "curious" }, { label: "Supportive", value: "supportive" }, { label: "Critical", value: "critical" }, { label: "Neutral", value: "neutral" }]} value={commentStyle} onChange={setCommentStyle} />
            </View>
          )}
          {action === "perspective" && (
            <View style={{ gap: 12 }}>
              <OptionGroup label="Tone" options={[{ label: "Neutral", value: "neutral" }, { label: "Gen-Z", value: "genz" }, { label: "Professional", value: "professional" }]} value={perspectiveTone} onChange={setPerspectiveTone} />
              <OptionGroup label="Slang level" options={[{ label: "None", value: "none" }, { label: "Light", value: "light" }, { label: "Heavy", value: "heavy" }]} value={perspectiveSlang} onChange={setPerspectiveSlang} />
            </View>
          )}
          {generateMutation.error ? <ErrorState message={(generateMutation.error as Error).message} /> : null}
          <Button label={generateMutation.isPending ? "Generating..." : `Generate ${ACTION_LABELS[action]}`} onPress={() => generateMutation.mutate()} disabled={!canGenerate || generateMutation.isPending} />
        </Card>

        {result && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Result</Text>
            {result.type === "summary" && (
              <>
                <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{result.data.summary}</Text>
                <ShareActions title="Summary" text={result.data.summary} />
              </>
            )}
            {result.type === "analysis" && result.data.variants?.map((v, i) => (
              <Accordion key={i} title={`Variant ${i + 1}${v.title ? `: ${v.title}` : ""}`}>
                <View style={{ gap: 6 }}>
                  <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{v.analysis}</Text>
                  {v.key_takeaways?.length ? <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{v.key_takeaways.map((t: string) => `• ${t}`).join("\n")}</Text> : null}
                  <ShareActions title={v.title ?? "Analysis"} text={[v.analysis, v.key_takeaways?.map((t: string) => `• ${t}`).join("\n")].filter(Boolean).join("\n\n")} />
                </View>
              </Accordion>
            ))}
            {result.type === "joke" && result.data.jokes?.map((j, i) => (
              <Accordion key={i} title={`Joke ${i + 1}`}>
                <View style={{ gap: 6 }}>
                  <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{j.full_joke}</Text>
                  <ShareActions title="Joke" text={j.full_joke} />
                </View>
              </Accordion>
            ))}
            {result.type === "viral" && result.data.variants?.map((v, i) => (
              <Accordion key={i} title={`Variant ${i + 1}`}>
                <View style={{ gap: 6 }}>
                  <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{v.hook}</Text>
                  <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{v.body}</Text>
                  {v.hashtags?.length ? <Text style={[styles.body, { color: theme.colors.textMuted }]}>{v.hashtags.join(" ")}</Text> : null}
                  <ShareActions title="Viral post" text={[v.body, v.hashtags?.join(" ")].filter(Boolean).join("\n\n")} />
                </View>
              </Accordion>
            ))}
            {result.type === "comment" && result.data.comments?.map((c, i) => (
              <Accordion key={i} title={`Comment ${i + 1} (${c.tone})`}>
                <View style={{ gap: 6 }}>
                  <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{c.comment}</Text>
                  {c.cta_question ? <Text style={[styles.body, { color: theme.colors.textMuted }]}>CTA: {c.cta_question}</Text> : null}
                  <ShareActions title="Comment" text={c.comment} />
                </View>
              </Accordion>
            ))}
            {result.type === "perspective" && (
              <View style={{ gap: 10 }}>
                {result.data.neutral_facts?.length ? (
                  <View>
                    <Text style={[styles.label, { color: theme.colors.textMuted }]}>Neutral facts</Text>
                    {result.data.neutral_facts.map((f: string, i: number) => (
                      <Text key={i} style={[styles.body, { color: theme.colors.textSecondary }]}>• {f}</Text>
                    ))}
                  </View>
                ) : null}
                {result.data.angles?.length ? (
                  <View>
                    <Text style={[styles.label, { color: theme.colors.textMuted }]}>Angles</Text>
                    {result.data.angles.map((a: { label: string; summary: string }, i: number) => (
                      <Accordion key={i} title={a.label}>
                        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{a.summary}</Text>
                      </Accordion>
                    ))}
                  </View>
                ) : null}
                <ShareActions
                  title="Perspective"
                  text={[
                    result.data.neutral_facts?.map((f: string) => `• ${f}`).join("\n"),
                    result.data.angles?.map((a: { label: string; summary: string }) => `${a.label}: ${a.summary}`).join("\n"),
                  ].filter(Boolean).join("\n\n")}
                />
              </View>
            )}
          </Card>
        )}

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 140, fontSize: 14, lineHeight: 20 },
  charCount: { fontSize: 11, lineHeight: 16 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionRow: { gap: 6, paddingVertical: 2 },
  body: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
});
