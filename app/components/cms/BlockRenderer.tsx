import React from "react";
import AlertBlock from "./AlertBlock";
import LexiconBlock from "./LexiconBlock";
import FinancialBlock from "./FinancialBlock";
import TimelineBlock from "./TimelineBlock";

export default function BlockRenderer({ block, context }: { block: any, context?: any }) {
  switch (block.type) {
    case "alert":
      return <AlertBlock data={block.data} />;
    case "financial":
      return <FinancialBlock data={block.data} context={context} />;
    case "lexicon":
      return <LexiconBlock data={block.data} />;
    case "timeline":
      return <TimelineBlock data={block.data} context={context} />;
    default:
      console.warn("Unknown block type:", block.type);
      return null;
  }
}
