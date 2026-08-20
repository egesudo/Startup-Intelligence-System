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
    dossierBadge: string;
    cachedBadge: string;
    cachedTooltip: string;
    rerunBypass: string;
    openPdfReport: string;
    compositeScore: string;
    finalRecommendation: string;
    fourDimensions: string;
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
    dossiersSectionTitle: string;
    dossiersSectionSubtitle: string;
    expandAll: string;
    collapseAll: string;
    downloadPdf: string;
    intelligenceFiles: string;
    sourcesTitle: string;
    transparentDirectory: string;
    inspectCitation: string;
    evidenceDistribution: string;
    highConfidence: string;
    mediumConfidence: string;
    lowConfidence: string;
    governanceTitle: string;
    founderDecision: string;
    recordedDecision: string;
    strategicDecisionSubtitle: string;
    founderRationale: string;
    rationalePlaceholder: string;
    overrideReason: string;
    overrideReasonPlaceholder: string;
    alignmentNotice: string;
    decisionSaved: string;
    saveDecisionBtn: string;
    saveStrategicDecision: string;
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
      dossierBadge: 'Venture Intelligence Dossier',
      cachedBadge: 'Cached & Verified',
      cachedTooltip: 'This venture idea was evaluated previously and loaded from deterministic cache. Scores are 100% stable.',
      rerunBypass: 'Re-analyze (Bypass Cache)',
      openPdfReport: 'Open PDF Report',
      compositeScore: 'Composite Venture Score',
      finalRecommendation: 'Final AI Recommendation',
      fourDimensions: '4 Core Readiness Dimensions',
      readinessScore: 'Venture Readiness Score',
      aiRecommendation: 'AI Recommendation',
      dimensionsTitle: 'Readiness Dimensions',
      problemUrgency: 'Problem Urgency',
      marketViability: 'Business Model & Revenue',
      defensibilityMoat: 'Defensibility & Moats',
      executionRisk: 'Execution & Delivery',
      strongestSignals: 'Strongest Empirical Signals',
      criticalRisks: 'Critical Risk Factors',
      criticalUnknowns: 'Decision-Critical Unknowns',
      immediateNextActions: '3 Priority Next Actions',
      dossiersSectionTitle: 'Deep-Dive Analytical Dossiers',
      dossiersSectionSubtitle: 'Click any dossier to expand complete technical findings and charts.',
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      downloadPdf: 'Download PDF',
      intelligenceFiles: 'Intelligence Dossiers & PDF Reports',
      sourcesTitle: 'Verified Citations & Sources',
      transparentDirectory: 'Transparent Evidence Directory',
      inspectCitation: 'Inspect',
      evidenceDistribution: 'Evidence Distribution',
      highConfidence: 'High Confidence',
      mediumConfidence: 'Medium Confidence',
      lowConfidence: 'Low Confidence',
      governanceTitle: 'Founder Governance & Decision Record',
      founderDecision: 'Founder Strategic Commitment',
      recordedDecision: 'Recorded Decision',
      strategicDecisionSubtitle: 'Select your strategic path based on the synthesized analysis.',
      founderRationale: 'Decision Rationale & Context',
      rationalePlaceholder: 'Add founder rationale or milestone notes (optional)...',
      overrideReason: 'Override Justification (Required if diverging from AI)',
      overrideReasonPlaceholder: 'State empirical reason or privileged insight behind diverging from AI verdict...',
      alignmentNotice: 'Alignment with AI evaluation calculated automatically upon recording.',
      decisionSaved: 'Strategic decision successfully recorded to immutable log.',
      saveDecisionBtn: 'Record Founder Decision',
      saveStrategicDecision: 'Record Strategic Decision',
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
      appName: 'Girişim Analiz ve Değerlendirme',
      founderCockpit: 'GİRİŞİM PANELİ',
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
      insufficientEvidence: 'Yetersiz veri',
      evidenceBacked: 'Veriye Dayalı',
      verified: 'Doğrulandı',
      confidence: 'Güvenilirlik',
      sources: 'Kaynaklar',
      findings: 'Bulgular',
      disagreements: 'Farklı Görüşler',
      fact: 'GERÇEK',
      inference: 'ÇIKARIM',
      assumption: 'VARSAYIM',
      completed: 'Tamamlandı',
      inProgress: 'Devam Ediyor',
      step: 'ADIM'
    },
    navigation: {
      intelligenceFlow: 'Analiz Aşamaları',
      ideaInput: 'Fikir ve Giriş',
      agentPipeline: 'Analiz Süreci',
      decisionCockpit: 'Değerlendirme ve Karar Paneli',
      specializedDossiers: 'Detaylı Raporlar',
      researchEvidence: 'Pazar ve Rakip Analizi',
      businessEconomics: 'İş Modeli ve Gelir Analizi',
      redTeamRisks: 'Risk ve Güvenlik Analizi',
      judgeSynthesis: 'Kapsamlı Değerlendirme Raporu',
      agentWorkspace: 'Analiz Kayıtları ve Telemetri',
      allVentures: 'Tüm Girişimler',
      noVenturesFound: 'Henüz değerlendirilmiş girişim bulunmuyor.',
      createNewPrompt: 'Başlamak için yeni bir girişim fikri ekleyin.',
      flowIdea: 'FİKİR',
      flowIntelligence: 'ANALİZ',
      flowEvidence: 'VERİLER',
      flowDecision: 'KARAR',
      flowAction: 'EYLEM'
    },
    agents: {
      researcher: {
        name: 'Pazar Araştırmacısı',
        role: 'Pazar Verileri ve Rakip İncelemesi',
        description: 'Güvenilir pazar verilerini, sektör araştırmalarını ve rakip çözümlerini derler.'
      },
      business: {
        name: 'İş Modeli Uzmanı',
        role: 'Gelir Modeli ve Karlılık Analizi',
        description: 'Kar marjlarını, birim maliyetleri ve ticari büyüme potansiyelini inceler.'
      },
      redTeam: {
        name: 'Risk Analisti',
        role: 'Risk Analizi ve Stres Testi',
        description: 'Kritik riskleri, eksik varsayımları ve olası başarısızlık senaryolarını test eder.'
      },
      judge: {
        name: 'Değerlendirme Uzmanı',
        role: 'Kapsamlı Sonuç Değerlendirmesi',
        description: 'Tüm analiz verilerini bir araya getirerek genel hazırlık puanını ve tavsiyeyi oluşturur.'
      },
      decisionMaker: {
        name: 'Karar Verici',
        role: 'Stratejik Karar ve Yol Haritası',
        description: 'Kurucunun stratejik tercihini kaydeder ve sonraki adımları belirler.'
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
      headerTitle: 'Girişim Değerlendirme ve Karar Paneli',
      headerSubtitle: '4 uzman modül tarafından analiz edilen pazar, gelir ve risk verilerinin özeti.',
      dossierBadge: 'Girişim Değerlendirme Dosyası',
      cachedBadge: 'Kayıtlı Analiz (Hızlı Yükleme)',
      cachedTooltip: 'Bu girişim fikri daha önce analiz edildiği için kayıtlı verilerden anında yüklendi. Puan ve sonuçlar sabittir.',
      rerunBypass: 'Sıfırdan Analiz Et',
      openPdfReport: 'PDF Raporunu Aç',
      compositeScore: 'Bileşik Girişim Puanı',
      finalRecommendation: 'Nihai Karar Tavsiyesi',
      fourDimensions: '4 Temel Hazırlık Boyutu',
      readinessScore: 'Girişim Hazırlık Puanı',
      aiRecommendation: 'Sistem Tavsiyesi',
      dimensionsTitle: 'Hazırlık Boyutları',
      problemUrgency: 'Problem Aciliyeti',
      marketViability: 'İş Modeli ve Gelir',
      defensibilityMoat: 'Savunma Hendekleri ve Rekabet',
      executionRisk: 'İcraat ve Süreç',
      strongestSignals: 'Ana Güçlü Sinyaller',
      criticalRisks: 'Kritik Risk Faktörleri',
      criticalUnknowns: 'Açıklığa Kavuşturulması Gereken Konular',
      immediateNextActions: '3 Öncelikli Eylem Adımı',
      dossiersSectionTitle: 'Detaylı Uzman Analiz Raporları',
      dossiersSectionSubtitle: 'İstediğiniz alanın üzerine tıklayarak tüm detayları ve grafikleri genişletin.',
      expandAll: 'Tümünü Genişlet',
      collapseAll: 'Tümünü Daralt',
      downloadPdf: 'PDF İndir',
      intelligenceFiles: 'Detaylı Raporlar ve PDF Dokümanları',
      sourcesTitle: 'Doğrulanabilir Kaynaklar ve Alıntılar',
      transparentDirectory: 'Şeffaf Kaynak Dizini',
      inspectCitation: 'İncele',
      evidenceDistribution: 'Veri Dağılımı',
      highConfidence: 'Yüksek Güvenilirlik',
      mediumConfidence: 'Orta Güvenilirlik',
      lowConfidence: 'Düşük Güvenilirlik',
      governanceTitle: 'Kurucu Kararı ve Notlar',
      founderDecision: 'Kurucu Stratejik Kararı',
      recordedDecision: 'Kayıtlı Karar',
      strategicDecisionSubtitle: 'Değerlendirme raporuna dayanarak bir sonraki stratejik yol haritanızı belirleyin.',
      founderRationale: 'Karar Gerekçesi ve Notlar',
      rationalePlaceholder: 'Kurucu gerekçesi veya kilometre taşı notu ekleyin (isteğe bağlı)...',
      overrideReason: 'Farklı Karar Gerekçesi (Sistem tavsiyesinden farklı bir yol seçiliyorsa)',
      overrideReasonPlaceholder: 'Sistem tavsiyesinden farklı düşünmenizin nedenini veya ek bilgilerinizi yazın...',
      alignmentNotice: 'Sistem değerlendirmesiyle uyum otomatik olarak kaydedilir.',
      decisionSaved: 'Stratejik karar başarıyla kaydedildi.',
      saveDecisionBtn: 'Kararı Kaydet',
      saveStrategicDecision: 'Stratejik Kararı Kaydet',
      noSourcesAvailable: 'Bu girişim için henüz harici kaynak kaydedilmedi.',
      externalLink: 'Kaynağı İncele',
      downloadAllPdf: 'Tüm Raporu PDF Olarak İndir',
      tradeoffsTitle: 'Karar ve Dengeler Matrisi'
    },
    input: {
      title: 'Girişim Fikri Analizi',
      titleHighlight: 'Kapsamlı Değerlendirme',
      subtitle: 'Girişim fikrinizi girin. 4 uzman analiz modülümüz pazar verilerini araştırır, iş modelini inceler, riskleri test eder ve objektif bir sonuç üretir.',
      ideaLabel: 'Girişim Fikri ve Değer Önerisi',
      ideaPlaceholder: 'Çözdüğünüz problemi, önerdiğiniz çözümü ve hedef kitlenizi açıklayın...',
      targetCustomerLabel: 'Hedef Müşteri Profili',
      targetCustomerPlaceholder: 'örn. Kurumsal Bilişim Yöneticileri, B2B SaaS Kurucuları, Sağlık Kuruluşları...',
      geographyLabel: 'İlk Hedef Pazar / Coğrafya',
      geographyPlaceholder: 'örn. Türkiye, Avrupa, Küresel...',
      contextLabel: 'Varsa Ek Bilgi veya Avantajınız (İsteğe Bağlı)',
      contextPlaceholder: 'Özel teknoloji, sektör tecrübesi, ilk pilot görüşmeleri vb...',
      startIntakeBtn: 'Analizi Başlat',
      quickPromptsTitle: 'Örnek Girişim Fikirleri',
      clarifyingTitle: 'Netleştirici Sorular',
      clarifyingSubtitle: 'Analizin doğruluğunu artırmak için lütfen soruları yanıtlayın.',
      yourAnswer: 'Cevabınız',
      answerPlaceholder: 'Bildiğiniz rakamları veya detayları yazın...',
      submitAnswer: 'Cevabı Kaydet',
      skipQuestion: 'Soruyu Atla',
      finalizePipelineBtn: 'Analizi Başlat'
    },
    pipeline: {
      title: 'Girişim Analizi Yürütülüyor',
      subtitle: 'Uzman modüller fikrinizi adım adım inceliyor.',
      runningPipeline: 'Modüller pazar verilerini topluyor, gelir modelini inceliyor ve riskleri değerlendiriyor...',
      pipelineComplete: 'Tüm modüllerin analiz süreci tamamlandı.',
      viewDecisionCockpit: 'Sonuç Paneline Git',
      inspectTelemetry: 'Analiz Detaylarını İncele',
      agentActivityWaiting: 'Sıra bekleniyor',
      agentActivityRunning: 'Analiz yürütülüyor ve veriler toplanıyor...',
      agentActivityDone: 'Analiz tamamlandı ve doğrulandı'
    },
    reports: {
      researchTitle: 'Pazar ve Rakip Analizi Raporu',
      researchSubtitle: 'Pazar büyüklüğü, mevcut çözümler ve doğrulanmış kaynaklar.',
      businessTitle: 'İş Modeli ve Gelir Analizi Raporu',
      businessSubtitle: 'Gelir modeli, marj beklentileri ve fiyatlandırma analizi.',
      redTeamTitle: 'Risk ve Stres Testi Raporu',
      redTeamSubtitle: 'Kritik riskler, test edilmemiş varsayımlar ve önlemler.',
      judgeTitle: 'Sonuç ve Kapsamlı Değerlendirme Raporu',
      judgeSubtitle: 'Genel değerlendirme, hazırlık puanı ve önerilen eylem adımları.',
      executiveSummary: 'Özet Değerlendirme',
      keyFindings: 'Temel Bulgular ve Veriler',
      competitorLandscape: 'Rakip Analizi ve Alternatifler',
      pricingUnitEconomics: 'Fiyatlandırma ve Gelir Yapısı',
      businessAssumptions: 'Temel İş Varsayımları',
      fatalFlaws: 'Kritik Riskler ve Zorluklar',
      killVectors: 'Olası Başarısızlık Nedenleri',
      challengedClaims: 'Doğrulanması Gereken İddialar',
      killScenarios: 'Olası Risk Senaryoları',
      arbitrationOverview: 'Değerlendirme Gerekçesi',
      coreThesis: 'Temel Girişim Hipotezi',
      crossAgentTensions: 'Uzman Görüşleri ve Değerlendirme Notları',
      traceabilityMatrix: 'Veri ve Kaynak Listesi'
    }
  }
};

