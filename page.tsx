
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, FileText, Briefcase, Wand2, KeyRound } from "lucide-react";
import { tailorCv } from "@/ai/flows/tailor-cv";
import { useToast } from "@/hooks/use-toast";

export default function ResumeAcePage() {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tailoredCv, setTailoredCv] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async () => {
    if (!apiKey) {
      setError("Please enter your Google AI API Key to continue.");
      toast({ title: "API Key Required", description: "Please enter your Google AI API Key.", variant: "destructive" });
      setShowResults(false);
      return;
    }
    if (!cvText) {
      setError("Please paste your CV to continue.");
      toast({ title: "Validation Error", description: "Please paste your CV.", variant: "destructive" });
      setShowResults(false);
      return;
    }
    if (!jobDescription) {
      setError("Please paste the job description to continue.");
      toast({ title: "Validation Error", description: "Please paste the job description.", variant: "destructive" });
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTailoredCv("");
    setShowResults(true); 

    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const result = await tailorCv({ cv: cvText, jobDescription, apiKey });
      if (result && result.tailoredCv) {
        setTailoredCv(result.tailoredCv);
        toast({ title: "Success!", description: "Your CV has been tailored." });
      } else {
        const errorMessage = "Failed to tailor CV. The response was not in the expected format, or the AI model could not process the request. Please check your API key and input data.";
        setError(errorMessage);
        toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
      }
    } catch (e) {
      console.error("Error tailoring CV:", e);
      let errorMessage = "An unknown error occurred while tailoring the CV.";
      if (e instanceof Error) {
        errorMessage = e.message;
        // Check for specific API key error messages from the flow
        if (errorMessage.toLowerCase().includes("api key") || errorMessage.toLowerCase().includes("permission_denied")) {
          errorMessage = "API Key error. Please ensure the API key you entered is valid and has the necessary permissions for the Google AI API."
        }
      }
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setTailoredCv(""); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header 
        className="text-white py-8 rounded-b-[20px] shadow-lg mb-8 bg-[linear-gradient(135deg,var(--gradient-start)_0%,var(--gradient-end)_100%)]"
        aria-labelledby="app-title"
      >
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <Wand2 size={40} />
            <h1 id="app-title" className="text-4xl font-bold">Resume Ace</h1>
          </div>
          <p className="text-lg opacity-90">AI-Powered CV Tailoring & Keyword Optimization</p>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12 flex-grow">
        
        <Alert className="mb-8 shadow-md rounded-lg border-accent bg-accent/10">
          <KeyRound className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent font-semibold">API Key Required</AlertTitle>
          <AlertDescription className="text-accent/80">
            To use Resume Ace, please enter your Google AI API Key in the field below. 
            You can obtain an API key from Google AI Studio. This application does not store your API key.
            If you previously set a <code>GEMINI_API_KEY</code> in a <code>.env</code> file, it will not be used by this interface.
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg rounded-lg mb-8">
          <CardHeader>
            <CardTitle className="text-accent section-title flex items-center gap-2">
              <KeyRound size={24} /> API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label htmlFor="api-key" className="block mb-2 font-semibold text-sm">Your Google AI API Key</label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Google AI API Key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-base rounded-md shadow-inner"
              aria-label="Google AI API Key input"
            />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-accent section-title flex items-center gap-2">
                <FileText size={24} /> Your Current CV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label htmlFor="cv-text" className="block mb-2 font-semibold text-sm">Copy and paste your CV here</label>
              <Textarea
                id="cv-text"
                placeholder="Paste your current resume/CV content here..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="h-64 min-h-[250px] text-base rounded-md shadow-inner"
                aria-label="Current CV text area"
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-accent section-title flex items-center gap-2">
                <Briefcase size={24} /> Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label htmlFor="job-description" className="block mb-2 font-semibold text-sm">Copy and paste the job description here</label>
              <Textarea
                id="job-description"
                placeholder="Paste the job description you're applying for..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="h-64 min-h-[250px] text-base rounded-md shadow-inner"
                aria-label="Job description text area"
              />
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-8">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="font-semibold text-base text-primary-foreground px-8 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 bg-[linear-gradient(135deg,var(--gradient-start)_0%,var(--gradient-end)_100%)] hover:bg-[linear-gradient(135deg,var(--gradient-start-hover)_0%,var(--gradient-end-hover)_100%)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Tailor My CV
              </>
            )}
          </Button>
        </div>
        
        {showResults && (
          <div ref={resultsRef} className="scroll-mt-20">
            {error && !isLoading && (
              <Alert variant="destructive" className="mb-8 shadow-lg rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Card className="shadow-lg rounded-lg" id="results-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 className="h-6 w-6 animate-spin text-accent" />}
                  {!isLoading && tailoredCv && <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />}
                  {!isLoading && !tailoredCv && error && <AlertTriangle className="h-6 w-6 text-destructive" />}
                  <CardTitle className="text-accent section-title">
                    {isLoading ? "Processing Your CV..." : (tailoredCv ? "Optimized CV" : "Results")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">
                    Hold tight! We're tailoring your CV...
                  </p>
                ) : tailoredCv ? (
                  <>
                    <CardDescription className="mb-4 text-sm">
                      Your CV has been tailored to match the job requirements. Copy the optimized version below:
                    </CardDescription>
                    <Textarea
                      id="optimized-cv"
                      value={tailoredCv}
                      readOnly
                      className="h-96 min-h-[300px] bg-muted/20 border-border text-base rounded-md shadow-inner"
                      aria-label="Optimized CV text area"
                    />
                  </>
                ) : !error ? (
                  <p className="text-muted-foreground">Please submit your CV and job description to see results.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="container mx-auto px-4 text-center py-6 text-xs text-muted-foreground border-t mt-auto">
        <p>Resume Ace © {currentYear ?? new Date().getFullYear()} | Your personal resume tailoring assistant.</p>
        <p className="mt-1">Powered by Genkit and Google AI</p>
      </footer>
    </div>
  );
}

