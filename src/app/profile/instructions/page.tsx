'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n/context';
import {
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';

interface FeeTier {
  range: string;
  rate: string;
  example: string;
}

interface Rule {
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function InstructionsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'payout' | 'payin' | 'faq'>('payout');

  // 代付任务规则
  const payoutRules: Rule[] = [
    {
      title: t('instructions.payoutRule1Title'),
      description: t('instructions.payoutRule1Desc'),
    },
    {
      title: t('instructions.payoutRule2Title'),
      description: t('instructions.payoutRule2Desc'),
    },
    {
      title: t('instructions.payoutRule3Title'),
      description: t('instructions.payoutRule3Desc'),
    },
    {
      title: t('instructions.payoutRule4Title'),
      description: t('instructions.payoutRule4Desc'),
    },
  ];

  // 代收任务规则
  const payinRules: Rule[] = [
    {
      title: t('instructions.payinRule1Title'),
      description: t('instructions.payinRule1Desc'),
    },
    {
      title: t('instructions.payinRule2Title'),
      description: t('instructions.payinRule2Desc'),
    },
    {
      title: t('instructions.payinRule3Title'),
      description: t('instructions.payinRule3Desc'),
    },
    {
      title: t('instructions.payinRule4Title'),
      description: t('instructions.payinRule4Desc'),
    },
  ];

  // 费率表
  const feeTiers: FeeTier[] = [
    {
      range: t('instructions.feeTier1Range'),
      rate: t('instructions.feeTier1Rate'),
      example: t('instructions.feeTier1Example'),
    },
    {
      range: t('instructions.feeTier2Range'),
      rate: t('instructions.feeTier2Rate'),
      example: t('instructions.feeTier2Example'),
    },
    {
      range: t('instructions.feeTier3Range'),
      rate: t('instructions.feeTier3Rate'),
      example: t('instructions.feeTier3Example'),
    },
    {
      range: t('instructions.feeTier4Range'),
      rate: t('instructions.feeTier4Rate'),
      example: t('instructions.feeTier4Example'),
    },
  ];

  // 常见问题
  const faqs: FAQ[] = [
    {
      question: t('instructions.faq1Question'),
      answer: t('instructions.faq1Answer'),
    },
    {
      question: t('instructions.faq2Question'),
      answer: t('instructions.faq2Answer'),
    },
    {
      question: t('instructions.faq3Question'),
      answer: t('instructions.faq3Answer'),
    },
    {
      question: t('instructions.faq4Question'),
      answer: t('instructions.faq4Answer'),
    },
    {
      question: t('instructions.faq5Question'),
      answer: t('instructions.faq5Answer'),
    },
  ];

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-6">
        {/* 页面标题 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t('instructions.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('instructions.description')}
          </p>
        </div>

        {/* 标签页切换 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payout">
              <FileText className="w-4 h-4 mr-2" />
              {t('instructions.payoutTasks')}
            </TabsTrigger>
            <TabsTrigger value="payin">
              <DollarSign className="w-4 h-4 mr-2" />
              {t('instructions.payinTasks')}
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              {t('instructions.faq')}
            </TabsTrigger>
          </TabsList>

          {/* 代付任务说明 */}
          <TabsContent value="payout" className="space-y-4">
            {/* 任务规则 */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('instructions.payoutRules')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('instructions.payoutRulesDesc')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {payoutRules.map((rule, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {rule.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 费率说明 */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('instructions.feeRates')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('instructions.feeRatesDesc')}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        {t('instructions.amountRange')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        {t('instructions.feeRate')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        {t('instructions.example')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTiers.map((tier, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-4 text-gray-900">
                          {tier.range}
                        </td>
                        <td className="py-3 px-4 text-blue-600 font-semibold">
                          {tier.rate}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {tier.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 注意事项 */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  {t('instructions.importantNotes')}
                </h3>
              </div>

              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.note1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.note2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.note3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.note4')}</span>
                </li>
              </ul>
            </Card>
          </TabsContent>

          {/* 代收任务说明 */}
          <TabsContent value="payin" className="space-y-4">
            {/* 任务规则 */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('instructions.payinRules')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('instructions.payinRulesDesc')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {payinRules.map((rule, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {rule.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 费率说明 */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('instructions.feeRates')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('instructions.feeRatesDesc')}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {t('instructions.payinFeeInfo')}
                </p>
              </div>
            </Card>

            {/* 注意事项 */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  {t('instructions.importantNotes')}
                </h3>
              </div>

              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.payinNote1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.payinNote2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.payinNote3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{t('instructions.payinNote4')}</span>
                </li>
              </ul>
            </Card>
          </TabsContent>

          {/* 常见问题 */}
          <TabsContent value="faq" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('instructions.commonQuestions')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('instructions.commonQuestionsDesc')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded mt-0.5">
                        Q{index + 1}
                      </span>
                      {faq.question}
                    </h4>
                    <p className="text-sm text-gray-600 pl-8">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 联系客服 */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  {t('instructions.needHelp')}
                </h3>
              </div>
              <p className="text-sm text-blue-800 mb-3">
                {t('instructions.needHelpDesc')}
              </p>
              <div className="text-sm text-blue-700">
                <p>{t('instructions.contactSupport')}</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
