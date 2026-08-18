export type Language = 'en' | 'tr';

export interface Translations {
  common: {
    appName: string;
    founderCockpit: string;
    newVenture: string;
    noVentureActive: string;
    loading: string;
    error: string;
    save: string;
    cancel: string;
    back: string;
    next: string;
    close: string;
    viewPdf: string;
    downloadPdf: string;
    insufficientEvidence: string;
    evidenceBacked: string;
    verified: string;
    confidence: string;
    sources: string;
    findings: string;
    disagreements: string;
    fact: string;
    inference: string;
    assumption: string;
    completed: string;
    inProgress: string;
    step: string;
  };
  navigation: {
    intelligenceFlow: string;
    ideaInput: string;
    agentPipeline: string;
    decisionCockpit: string;
    specializedDossiers: string;
    researchEvidence: string;
    businessEconomics: string;
    redTeamRisks: string;
    judgeSynthesis: string;
    agentWorkspace: string;
    allVentures: string;
    noVenturesFound: string;
    createNewPrompt: string;
    flowIdea: string;
    flowIntelligence: string;
    flowEvidence: string;
    flowDecision: string;
    flowAction: string;
  };
  agents: {
    researcher: {
      name: string;
      role: string;
      description: string;
    };
    business: {
      name: string;
      role: string;
      description: string;
    };
    redTeam: {
      name: string;
      role: string;
      description: string;
    };
    judge: {
      name: string;
      role: string;
      description: string;
    };
    decisionMaker: {
      name: string;
      role: string;
      description: string;
    };
  };
  recommendations: {
    build: string;
    validateFirst: string;
    redesign: string;
    doNotPursue: string;
  };
  severities: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
  dashboard: {
    headerTitle: string;
    headerSubtitle: string;
    readinessScore: string;
    aiRecommendation: string;
    dimensionsTitle: string;
    problemUrgency: string;
    marketViability: string;
    defensibilityMoat: string;
    executionRisk: string;
    strongestSignals: string;
    criticalRisks: string;
    criticalUnknowns: string;
    immediateNextActions: string;
    intelligenceFiles: string;
    sourcesTitle: string;
    evidenceDistribution: string;
    highConfidence: string;
    mediumConfidence: string;
    lowConfidence: string;
    governanceTitle: string;
    founderDecision: string;
    founderRationale: string;
    overrideReason: string;
    overrideReasonPlaceholder: string;
    alignmentNotice: string;
    decisionSaved: string;
    saveDecisionBtn: string;
    noSourcesAvailable: string;
    externalLink: string;
    downloadAllPdf: string;
    tradeoffsTitle: string;
  };
  input: {
    title: string;
    titleHighlight?: string;
    subtitle: string;
    ideaLabel: string;
    ideaPlaceholder: string;
    targetCustomerLabel: string;
    targetCustomerPlaceholder: string;
    geographyLabel: string;
    geographyPlaceholder: string;
    contextLabel: string;
    contextPlaceholder: string;
    startIntakeBtn: string;
    quickPromptsTitle: string;
    clarifyingTitle: string;
    clarifyingSubtitle: string;
    yourAnswer: string;
    answerPlaceholder: string;
    submitAnswer: string;
    skipQuestion: string;
    finalizePipelineBtn: string;
  };
  pipeline: {
    title: string;
    subtitle: string;
    runningPipeline: string;
    pipelineComplete: string;
    viewDecisionCockpit: string;
    inspectTelemetry: string;
    agentActivityWaiting: string;
    agentActivityRunning: string;
    agentActivityDone: string;
  };
  reports: {
    researchTitle: string;
    researchSubtitle: string;
    businessTitle: string;
    businessSubtitle: string;
    redTeamTitle: string;
    redTeamSubtitle: string;
    judgeTitle: string;
    judgeSubtitle: string;
    executiveSummary: string;
    keyFindings: string;
    competitorLandscape: string;
    pricingUnitEconomics: string;
    businessAssumptions: string;
    fatalFlaws: string;
    killVectors: string;
    challengedClaims: string;
    killScenarios: string;
    arbitrationOverview: string;
    coreThesis: string;
    crossAgentTensions: string;
    traceabilityMatrix: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      appName: 'Startup Intelligence',
      founderCockpit: 'FOUNDER COCKPIT',
      newVenture: 'New Venture',
      noVentureActive: 'No Venture Active',
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      viewPdf: 'View PDF',
      downloadPdf: 'Download PDF',
      insufficientEvidence: 'Insufficient reliable evidence',
      evidenceBacked: 'Evidence-Backed',
      verified: 'Verified',
      confidence: 'Confidence',
      sources: 'Sources',
      findings: 'Findings',
      disagreements: 'Disagreements',
      fact: 'FACT',
      inference: 'INFERENCE',
      assumption: 'ASSUMPTION',
      completed: 'Completed',
      inProgress: 'In Progress',
      step: 'STEP'
    },
    navigation: {
      intelligenceFlow: 'Intelligence Flow',
      ideaInput: 'Idea & Intake',
      agentPipeline: 'Agent Pipeline',
      decisionCockpit: 'Decision Cockpit',
      specializedDossiers: 'Specialized Dossiers',
      researchEvidence: 'Research Evidence',
      businessEconomics: 'Business Economics',
      redTeamRisks: 'Red Team Risks',
      judgeSynthesis: 'Judge Synthesis',
      agentWorkspace: 'Agent Telemetry',
      allVentures: 'All Ventures',
      noVenturesFound: 'No ventures evaluated yet.',
      createNewPrompt: 'Create a new venture to start.',
      flowIdea: 'IDEA',
      flowIntelligence: 'INTELLIGENCE',
      flowEvidence: 'EVIDENCE',
      flowDecision: 'DECISION',
      flowAction: 'ACTION'
    },
    agents: {
      researcher: {
        name: 'Researcher',
        role: 'Market Evidence & Fact-Finding',
        description: 'Collects verified sources, empirical market data, and competitor benchmarks.'
      },
      business: {
        name: 'Business',
        role: 'Unit Economics & Monetization',
        description: 'Analyzes margins, business model viability, and defensibility moats.'
      },
      redTeam: {
        name: 'Red Team',
        role: 'Adversarial Stress Testing',
        description: 'Challenges dogmas, attacks assumptions, and identifies lethal failure conditions.'
      },
      judge: {
        name: 'Judge',
        role: 'Cross-Agent Arbitration',
        description: 'Synthesizes all evidence, resolves agent tensions, and computes readiness score.'
      },
      decisionMaker: {
        name: 'Decision Maker',
        role: 'Venture Verdict & Governance',
        description: 'Guides founder commitment, records strategic alignment, and frames next moves.'
      }
    },
    recommendations: {
      build: 'BUILD',
      validateFirst: 'VALIDATE FIRST',
      redesign: 'REDESIGN',
      doNotPursue: 'DO NOT PURSUE'
    },
    severities: {
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW'
    },
    dashboard: {
      headerTitle: 'Executive Intelligence & Decision Cockpit',
      headerSubtitle: 'Synthesized intelligence from 4 specialized agents. Evaluated against empirical evidence.',
      readinessScore: 'Venture Readiness Score',
      aiRecommendation: 'AI Recommendation',
      dimensionsTitle: 'Readiness Dimensions',
      problemUrgency: 'Problem Urgency',
      marketViability: 'Market Viability',
      defensibilityMoat: 'Defensibility / Moat',
      executionRisk: 'Execution Risk',
      strongestSignals: 'Strongest Empirical Signals',
      criticalRisks: 'Critical Risks & Failure Vectors',
      criticalUnknowns: 'Decision-Critical Unknowns',
      immediateNextActions: 'Strictly 3 Empirical Next Actions',
      intelligenceFiles: 'Intelligence Dossiers & PDF Reports',
      sourcesTitle: 'Verified Citations & Evidence Traceability',
      evidenceDistribution: 'Evidence Distribution',
      highConfidence: 'High Confidence',
      mediumConfidence: 'Medium Confidence',
      lowConfidence: 'Low Confidence',
      governanceTitle: 'Founder Governance & Decision Record',
      founderDecision: 'Founder Strategic Commitment',
      founderRationale: 'Decision Rationale & Context',
      overrideReason: 'Override Justification (Required if diverging from AI)',
      overrideReasonPlaceholder: 'State empirical reason or privileged insight behind diverging from AI verdict...',
      alignmentNotice: 'Alignment with AI evaluation calculated automatically upon recording.',
      decisionSaved: 'Strategic decision successfully recorded to immutable log.',
      saveDecisionBtn: 'Record Founder Decision',
      noSourcesAvailable: 'No external sources recorded for this venture.',
      externalLink: 'Open Citation',
      downloadAllPdf: 'Download Complete Intelligence Dossier',
      tradeoffsTitle: 'Multi-Agent Trade-Off Matrix'
    },
    input: {
      title: 'Venture Idea Intake',
      titleHighlight: 'Adversarial Intelligence',
      subtitle: 'Submit your startup concept. Our 4 specialized agents will research evidence, attack assumptions, test economics, and formulate an objective verdict.',
      ideaLabel: 'Startup Idea & Value Proposition',
      ideaPlaceholder: 'Describe the problem you are solving, proposed solution, and why it matters...',
      targetCustomerLabel: 'Target Customer / ICP',
      targetCustomerPlaceholder: 'e.g. Enterprise DevOps leads, B2B SaaS Founders, Oncology clinics...',
      geographyLabel: 'Initial Target Geography / Market',
      geographyPlaceholder: 'e.g. US Enterprise, Europe, Global Remote...',
      contextLabel: 'Known Context or Founder Advantage (Optional)',
      contextPlaceholder: 'Any proprietary tech, domain expertise, or early pilot data...',
      startIntakeBtn: 'Generate Clarifying Questions',
      quickPromptsTitle: 'Example Venture Archetypes',
      clarifyingTitle: 'Clarifying Questions',
      clarifyingSubtitle: 'Answer the key clarifying questions to sharpen agent fact-finding.',
      yourAnswer: 'Your Answer',
      answerPlaceholder: 'Provide specific context or numbers if known...',
      submitAnswer: 'Save Answer',
      skipQuestion: 'Skip Question',
      finalizePipelineBtn: 'Launch 4-Agent Analysis Pipeline'
    },
    pipeline: {
      title: 'Multi-Agent Pipeline Execution',
      subtitle: 'Real-time coordinated intelligence pipeline.',
      runningPipeline: 'Agents are actively researching, modeling economics, and stress testing...',
      pipelineComplete: 'Intelligence synthesized across all 4 specialized agents.',
      viewDecisionCockpit: 'Enter Decision Cockpit',
      inspectTelemetry: 'Inspect Agent Telemetry',
      agentActivityWaiting: 'Waiting for pipeline sequence',
      agentActivityRunning: 'Executing analysis & gathering evidence...',
      agentActivityDone: 'Intelligence generated & validated'
    },
    reports: {
      researchTitle: 'Research Intelligence Dossier',
      researchSubtitle: 'Empirical fact-finding, verified sources, and competitive landscape.',
      businessTitle: 'Business & Economic Model Dossier',
      businessSubtitle: 'Unit economics audit, pricing mechanisms, and moat sustainability.',
      redTeamTitle: 'Red Team Adversarial Audit',
      redTeamSubtitle: 'Lethal failure conditions, pre-mortem triggers, and assumption attacks.',
      judgeTitle: 'Judicial Synthesis & Verdict',
      judgeSubtitle: 'Cross-agent arbitration, thesis validation, and definitive readiness scoring.',
      executiveSummary: 'Executive Summary',
      keyFindings: 'Key Findings & Empirical Data',
      competitorLandscape: 'Competitor Landscape & Moats',
      pricingUnitEconomics: 'Pricing & Unit Economics',
      businessAssumptions: 'Critical Business Assumptions',
      fatalFlaws: 'Critical Risks & Kill Scenarios',
      killVectors: 'Kill Vectors & Failure Mechanisms',
      challengedClaims: 'Challenged Founder Claims',
      killScenarios: 'Pre-Mortem Failure Triggers',
      arbitrationOverview: 'Judicial Recommendation Rationale',
      coreThesis: 'Core Venture Thesis Validation',
      crossAgentTensions: 'Arbitrated Cross-Agent Disagreements',
      traceabilityMatrix: 'Evidence Traceability Matrix'
    }
  },
  tr: {
    common: {
      appName: 'Girişim İstihbaratı',
      founderCockpit: 'KURUCU KOKPİTİ',
      newVenture: 'Yeni Girişim',
      noVentureActive: 'Aktif Girişim Yok',
      loading: 'Yükleniyor...',
      error: 'Bir hata oluştu',
      save: 'Kaydet',
      cancel: 'İptal',
      back: 'Geri',
      next: 'İleri',
      close: 'Kapat',
      viewPdf: 'PDF İncele',
      downloadPdf: 'PDF İndir',
      insufficientEvidence: 'Yetersiz güvenilir kanıt',
      evidenceBacked: 'Kanıta Dayalı',
      verified: 'Doğrulandı',
      confidence: 'Güvenilirlik',
      sources: 'Kaynaklar',
      findings: 'Bulgular',
      disagreements: 'Uyuşmazlıklar',
      fact: 'OLGU',
      inference: 'ÇIKARIM',
      assumption: 'VARSAYIM',
      completed: 'Tamamlandı',
      inProgress: 'Devam Ediyor',
      step: 'ADIM'
    },
    navigation: {
      intelligenceFlow: 'İstihbarat Akışı',
      ideaInput: 'Fikir & Giriş',
      agentPipeline: 'Ajan Hattı',
      decisionCockpit: 'Karar Kokpiti',
      specializedDossiers: 'Uzman Dosyaları',
      researchEvidence: 'Pazar Kanıtları',
      businessEconomics: 'İş Ekonomisi',
      redTeamRisks: 'Red Team Riskleri',
      judgeSynthesis: 'Hakem Sentezi',
      agentWorkspace: 'Ajan Telemetrisi',
      allVentures: 'Tüm Girişimler',
      noVenturesFound: 'Henüz değerlendirilmiş girişim yok.',
      createNewPrompt: 'Başlamak için yeni bir girişim oluşturun.',
      flowIdea: 'FİKİR',
      flowIntelligence: 'İSTİHBARAT',
      flowEvidence: 'KANIT',
      flowDecision: 'KARAR',
      flowAction: 'EYLEM'
    },
    agents: {
      researcher: {
        name: 'Araştırmacı',
        role: 'Pazar Kanıtı & Veri Tespiti',
        description: 'Doğrulanmış kaynakları, ampirik pazar verilerini ve rakip kıyaslamalarını toplar.'
      },
      business: {
        name: 'İş Modeli Uzmanı',
        role: 'Birim Ekonomisi & Gelir Modeli',
        description: 'Karlılık marjlarını, iş modeli uygulanabilirliğini ve savunma hendeklerini inceler.'
      },
      redTeam: {
        name: 'Red Team',
        role: 'Karşıt Stres Testi & Riskler',
        description: 'Dogmaları sorgular, varsayımlara saldırır ve ölümcül iflas koşullarını ortaya çıkarır.'
      },
      judge: {
        name: 'Hakem (Judge)',
        role: 'Çapraz Ajan Hakemliği',
        description: 'Tüm kanıtları sentezler, ajan çelişkilerini çözer ve hazırlık skorunu hesaplar.'
      },
      decisionMaker: {
        name: 'Karar Verici',
        role: 'Girişim Kararı & Yönetişim',
        description: 'Kurucu taahhüdünü yönlendirir, stratejik uyumu kaydeder ve sonraki adımları belirler.'
      }
    },
    recommendations: {
      build: 'İNŞA ET',
      validateFirst: 'ÖNCE DOĞRULA',
      redesign: 'YENİDEN TASARLA',
      doNotPursue: 'DEVAM ETME'
    },
    severities: {
      critical: 'KRİTİK',
      high: 'YÜKSEK',
      medium: 'ORTA',
      low: 'DÜŞÜK'
    },
    dashboard: {
      headerTitle: 'Yönetici İstihbaratı & Karar Kokpiti',
      headerSubtitle: '4 uzman ajanın sentezlenmiş istihbaratı. Ampirik kanıtlarla değerlendirilmiştir.',
      readinessScore: 'Girişim Hazırlık Skoru',
      aiRecommendation: 'Yapay Zeka Tavsiyesi',
      dimensionsTitle: 'Hazırlık Boyutları',
      problemUrgency: 'Problem Aciliyeti',
      marketViability: 'Pazar Uygulanabilirliği',
      defensibilityMoat: 'Savunulabilirlik / Hendek',
      executionRisk: 'Uygulama Riski',
      strongestSignals: 'En Güçlü Ampirik Sinyaller',
      criticalRisks: 'Kritik Riskler & İflas Vektörleri',
      criticalUnknowns: 'Karar Açısından Kritik Bilinmeyenler',
      immediateNextActions: 'Öncelikli 3 Ampirik Sonraki Eylem',
      intelligenceFiles: 'İstihbarat Dosyaları & PDF Raporları',
      sourcesTitle: 'Doğrulanmış Kaynaklar ve Kanıt İzlenebilirliği',
      evidenceDistribution: 'Kanıt Dağılımı',
      highConfidence: 'Yüksek Güvenilirlik',
      mediumConfidence: 'Orta Güvenilirlik',
      lowConfidence: 'Düşük Güvenilirlik',
      governanceTitle: 'Kurucu Yönetişimi & Karar Kaydı',
      founderDecision: 'Kurucu Stratejik Taahhüdü',
      founderRationale: 'Karar Gerekçesi & Bağlam',
      overrideReason: 'Farklı Karar Gerekçesi (Yapay Zeka tavsiyesinden ayrışıyorsa zorunlu)',
      overrideReasonPlaceholder: 'Yapay Zeka kararından ayrışmanızın arkasındaki ampirik sebebi veya özel bilgiyi belirtin...',
      alignmentNotice: 'Yapay Zeka değerlendirmesiyle uyum, kayıt sırasında otomatik hesaplanır.',
      decisionSaved: 'Stratejik karar değişmez log kayıtlarına başarıyla işlendi.',
      saveDecisionBtn: 'Kurucu Kararını Kaydet',
      noSourcesAvailable: 'Bu girişim için harici kaynak kaydedilmedi.',
      externalLink: 'Kaynağı Aç',
      downloadAllPdf: 'Tüm İstihbarat Dosyasını İndir',
      tradeoffsTitle: 'Çapraz Ajan Ödünleşim Matrisi'
    },
    input: {
      title: 'Girişim Fikri Girişi',
      titleHighlight: 'Karşıt İstihbarat',
      subtitle: 'Girişim fikrinizi girin. 4 uzman ajanımız kanıtları araştıracak, varsayımları sınayacak, ekonomiyi test edecek ve tarafsız bir karar üretecektir.',
      ideaLabel: 'Girişim Fikri ve Değer Önerisi',
      ideaPlaceholder: 'Çözdüğünüz problemi, önerilen çözümü ve neden önemli olduğunu açıklayın...',
      targetCustomerLabel: 'Hedef Müşteri Profili (ICP)',
      targetCustomerPlaceholder: 'örn. Kurumsal DevOps Liderleri, B2B SaaS Kurucuları, Onkoloji klinikleri...',
      geographyLabel: 'İlk Hedef Pazar / Coğrafya',
      geographyPlaceholder: 'örn. Türkiye, Avrupa, ABD Kurumsal, Küresel Uzaktan...',
      contextLabel: 'Bilinen Bağlam veya Kurucu Avantajı (Opsiyonel)',
      contextPlaceholder: 'Tescilli teknoloji, sektör uzmanlığı veya erken pilot veriler...',
      startIntakeBtn: 'Açıklayıcı Soruları Oluştur',
      quickPromptsTitle: 'Örnek Girişim Modelleri',
      clarifyingTitle: 'Açıklayıcı Sorular',
      clarifyingSubtitle: 'Ajanların araştırma hassasiyetini artırmak için soruları yanıtlayın.',
      yourAnswer: 'Cevabınız',
      answerPlaceholder: 'Mümkünse spesifik bağlam veya rakamlar belirtin...',
      submitAnswer: 'Cevabı Kaydet',
      skipQuestion: 'Soruyu Atla',
      finalizePipelineBtn: '4 Ajanlı Analiz Hattını Başlat'
    },
    pipeline: {
      title: 'Çok Ajanlı Analiz Hattı Çalışıyor',
      subtitle: 'Gerçek zamanlı koordineli istihbarat süreci.',
      runningPipeline: 'Ajanlar aktif olarak araştırıyor, ekonomiyi modelliyor ve stres testi uyguluyor...',
      pipelineComplete: '4 uzman ajan tarafından istihbarat sentezlendi.',
      viewDecisionCockpit: 'Karar Kokpitine Gir',
      inspectTelemetry: 'Ajan Telemetrisini İncele',
      agentActivityWaiting: 'Sıra bekleniyor',
      agentActivityRunning: 'Analiz yürütülüyor ve kanıtlar toplanıyor...',
      agentActivityDone: 'İstihbarat üretildi ve doğrulandı'
    },
    reports: {
      researchTitle: 'Pazar Araştırması İstihbarat Dosyası',
      researchSubtitle: 'Ampirik veri tespiti, doğrulanmış kaynaklar ve rekabet haritası.',
      businessTitle: 'İş Modeli ve Birim Ekonomisi Dosyası',
      businessSubtitle: 'Birim ekonomisi denetimi, fiyatlandırma mekanizmaları ve hendek sürdürülebilirliği.',
      redTeamTitle: 'Red Team Karşıt Güvenlik Denetimi',
      redTeamSubtitle: 'Ölümcül iflas koşulları, pre-mortem tetikleyicileri ve varsayım saldırıları.',
      judgeTitle: 'Hakem Sentezi ve Girişim Kararı',
      judgeSubtitle: 'Çapraz ajan hakemliği, tez doğrulaması ve kesin hazırlık puanlaması.',
      executiveSummary: 'Yönetici Özeti',
      keyFindings: 'Temel Bulgular ve Ampirik Veriler',
      competitorLandscape: 'Rakip Haritası ve Savunma Hendekleri',
      pricingUnitEconomics: 'Fiyatlandırma ve Birim Ekonomisi',
      businessAssumptions: 'Kritik İş Varsayımları',
      fatalFlaws: 'Kritik Riskler ve İflas Senaryoları',
      killVectors: 'İflas Vektörleri ve Başarısızlık Mekanizmaları',
      challengedClaims: 'Sorgulanan Kurucu İddiaları',
      killScenarios: 'Pre-Mortem İflas Tetikleyicileri',
      arbitrationOverview: 'Hakem Tavsiye Gerekçesi',
      coreThesis: 'Temel Girişim Tezi Doğrulaması',
      crossAgentTensions: 'Hakem Kararına Bağlanan Çelişkiler',
      traceabilityMatrix: 'Kanıt İzlenebilirlik Matrisi'
    }
  }
};
