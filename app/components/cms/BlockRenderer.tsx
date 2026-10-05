import React from "react";
import AlertBlock from "./AlertBlock";
import LexiconBlock from "./LexiconBlock";
import FinancialOverviewBlock from "./FinancialOverviewBlock";
import OptionsComparisonBlock from "./OptionsComparisonBlock";
import StressTestBlock from "./StressTestBlock";
import ConclusionBlock from "./ConclusionBlock";
import TimelineBlock from "./TimelineBlock";

export default function BlockRenderer({ block, context }: { block: any; context?: any }) {
  switch (block.type) {
    case "alert":
      return <AlertBlock data={block.data} />;
    case "financial_overview":
      return <FinancialOverviewBlock data={block.data} context={context} />;
    case "options_comparison":
      return <OptionsComparisonBlock data={block.data} context={context} />;
    case "stress_test":
      return <StressTestBlock data={block.data} context={context} />;
    case "conclusion":
      return <ConclusionBlock data={block.data} context={context} />;
    case "lexicon":
      return <LexiconBlock data={block.data} />;
    case "timeline":
      return <TimelineBlock data={block.data} context={context} />;
    default:
      console.warn("Unknown block type:", block.type);
      return null;
  }
}
