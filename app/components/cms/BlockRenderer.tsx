import React from "react";
import AlertBlock from "./AlertBlock";
import LexiconBlock from "./LexiconBlock";
import FinancialBlock from "./FinancialBlock";
import TimelineBlock from "./TimelineBlock";

export default function BlockRenderer({ block }: { block: any }) {
  switch (block.type) {
    case "alert":
      return <AlertBlock data={block.data} />;
    case "financial":
      return <FinancialBlock data={block.data} />;
    case "lexicon":
      return <LexiconBlock data={block.data} />;
    case "timeline":
      return <TimelineBlock data={block.data} />;
    default:
      console.warn("Unknown block type:", block.type);
      return null;
  }
}
