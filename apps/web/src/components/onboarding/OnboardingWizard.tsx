import { Button } from '@quantpilot/ui';
import { type ReactNode, useCallback, useState } from 'react';
import {
  body,
  btnSkip,
  featureDesc,
  featureIcon,
  featureItem,
  featureList,
  featureText,
  featureTitle,
  footer,
  header,
  overlay,
  progress,
  progressBar,
  progressBarActive,
  stepContent,
  subtitle,
  title,
  wizard,
} from './Onboarding.css.js';

const STORAGE_KEY = 'qp-onboarding-complete';

interface Step {
  id: string;
  title: string;
  subtitle: string;
  content: ReactNode;
}

interface OnboardingWizardProps {
  locale?: 'zh' | 'en';
  onComplete: () => void;
}

function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // ignore
  }
}

const FEATURES_ZH = [
  { icon: '📊', title: '策略回测', desc: '在历史数据上验证你的量化策略' },
  { icon: '⚡', title: '纸面执行', desc: '把策略信号转成可控执行计划' },
  { icon: '🛡️', title: '风控系统', desc: '用基础风控参数保护纸面执行流程' },
];

const FEATURES_EN = [
  {
    icon: '📊',
    title: 'Strategy Backtesting',
    desc: 'Validate your strategies against historical data',
  },
  { icon: '⚡', title: 'Paper Execution', desc: 'Turn strategy signals into controlled plans' },
  {
    icon: '🛡️',
    title: 'Risk Management',
    desc: 'Use basic risk parameters to protect the paper execution flow',
  },
];

export function OnboardingWizard({ locale = 'en', onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 'welcome',
      title: locale === 'zh' ? '欢迎使用 QuantPilot' : 'Welcome to QuantPilot',
      subtitle:
        locale === 'zh'
          ? 'AI 原生量化交易平台，让策略研究、回测和执行变得简单高效。'
          : 'The AI-native quantitative trading platform that simplifies strategy research, backtesting, and execution.',
      content: (
        <div className={featureList}>
          {(locale === 'zh' ? FEATURES_ZH : FEATURES_EN).map((f) => (
            <div key={f.title} className={featureItem}>
              <div className={featureIcon}>{f.icon}</div>
              <div className={featureText}>
                <div className={featureTitle}>{f.title}</div>
                <div className={featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'broker',
      title: locale === 'zh' ? '连接券商' : 'Connect Broker',
      subtitle:
        locale === 'zh'
          ? '在设置页面配置你的券商 API 密钥，连接实盘或模拟账户。'
          : 'Configure your broker API keys in Settings to connect live or paper accounts.',
      content: (
        <div className={featureList}>
          <div className={featureItem}>
            <div className={featureIcon}>🔑</div>
            <div className={featureText}>
              <div className={featureTitle}>{locale === 'zh' ? 'API 密钥' : 'API Keys'}</div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '在 设置 → 券商连接 中添加你的 API Key 和 Secret'
                  : 'Add your API Key and Secret in Settings → Broker Connection'}
              </div>
            </div>
          </div>
          <div className={featureItem}>
            <div className={featureIcon}>📋</div>
            <div className={featureText}>
              <div className={featureTitle}>{locale === 'zh' ? '模拟账户' : 'Paper Account'}</div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '默认启用模拟账户，无需真实资金即可体验完整功能'
                  : 'Paper account is enabled by default — experience full features without real capital'}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'risk',
      title: locale === 'zh' ? '设置风控参数' : 'Set Risk Parameters',
      subtitle:
        locale === 'zh'
          ? '配置止损、仓位限制等风控参数，保护你的资金安全。'
          : 'Configure stop-loss, position limits, and other risk parameters to protect your capital.',
      content: (
        <div className={featureList}>
          <div className={featureItem}>
            <div className={featureIcon}>🛑</div>
            <div className={featureText}>
              <div className={featureTitle}>{locale === 'zh' ? '止损规则' : 'Stop-Loss Rules'}</div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '设置最大回撤和单笔亏损限制'
                  : 'Set maximum drawdown and per-trade loss limits'}
              </div>
            </div>
          </div>
          <div className={featureItem}>
            <div className={featureIcon}>📊</div>
            <div className={featureText}>
              <div className={featureTitle}>{locale === 'zh' ? '仓位控制' : 'Position Sizing'}</div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '配置最大持仓比例和单标的上限'
                  : 'Configure max exposure ratios and per-symbol limits'}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'backtest',
      title: locale === 'zh' ? '运行第一次回测' : 'Run Your First Backtest',
      subtitle:
        locale === 'zh'
          ? '选择策略和历史数据区间，评估策略表现。'
          : 'Select a strategy and historical date range to evaluate performance.',
      content: (
        <div className={featureList}>
          <div className={featureItem}>
            <div className={featureIcon}>🔬</div>
            <div className={featureText}>
              <div className={featureTitle}>{locale === 'zh' ? '选择策略' : 'Select Strategy'}</div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '从策略库中选择一个评分较高的策略'
                  : 'Choose a high-scoring strategy from your strategy library'}
              </div>
            </div>
          </div>
          <div className={featureItem}>
            <div className={featureIcon}>📅</div>
            <div className={featureText}>
              <div className={featureTitle}>
                {locale === 'zh' ? '设置时间区间' : 'Set Date Range'}
              </div>
              <div className={featureDesc}>
                {locale === 'zh'
                  ? '建议使用 1-3 年的历史数据进行回测'
                  : 'Recommended: 1-3 years of historical data for backtesting'}
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markComplete();
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSkip = useCallback(() => {
    markComplete();
    onComplete();
  }, [onComplete]);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className={overlay}>
      <div className={wizard}>
        <div className={header}>
          <div className={progress}>
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`${progressBar}${i <= currentStep ? ` ${progressBarActive}` : ''}`}
              />
            ))}
          </div>
          <h2 className={title}>{step.title}</h2>
          <p className={subtitle}>{step.subtitle}</p>
        </div>

        <div className={body}>
          <div className={stepContent} key={step.id}>
            {step.content}
          </div>
        </div>

        <div className={footer}>
          <div>
            {currentStep > 0 && (
              <Button variant="secondary" size="md" onClick={handleBack}>
                {locale === 'zh' ? '上一步' : 'Back'}
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className={btnSkip} onClick={handleSkip}>
              {locale === 'zh' ? '跳过引导' : 'Skip tour'}
            </button>
            <Button variant="primary" size="md" onClick={handleNext}>
              {isLast
                ? locale === 'zh'
                  ? '开始使用'
                  : 'Get Started'
                : locale === 'zh'
                  ? '下一步'
                  : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { isOnboardingComplete };
