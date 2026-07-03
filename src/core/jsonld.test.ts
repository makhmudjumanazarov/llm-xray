import { describe, it, expect } from "vitest";
import {
  organizationNode,
  websiteNode,
  breadcrumbNode,
  webPageNode,
  datasetNode,
  itemListNode,
  techArticleNode,
  learningResourceNode,
  softwareApplicationNode,
  webApplicationNode,
  faqNode,
  graph,
} from "./jsonld";

describe("jsonld builders", () => {
  it("organization + website share a stable @id graph", () => {
    const g = graph(organizationNode(), websiteNode("en"));
    expect(g["@context"]).toBe("https://schema.org");
    const nodes = g["@graph"] as Record<string, unknown>[];
    expect(nodes).toHaveLength(2);
    const org = nodes.find((n) => n["@type"] === "Organization")!;
    const site = nodes.find((n) => n["@type"] === "WebSite")!;
    // website.publisher references the org by @id
    expect((site.publisher as { "@id": string })["@id"]).toBe(org["@id"]);
  });

  it("websiteNode SearchAction targets the locale's models list with a query slot", () => {
    const site = websiteNode("ru");
    const action = site.potentialAction as { target: { urlTemplate: string }; "query-input": string };
    expect(action.target.urlTemplate).toContain("/ru/models?q={search_term_string}");
    expect(action["query-input"]).toContain("search_term_string");
  });

  it("breadcrumb positions are 1-based and absolute", () => {
    const bc = breadcrumbNode([
      { name: "Home", path: "/en" },
      { name: "Models", path: "/en/models" },
    ]);
    const els = bc.itemListElement as { position: number; item: string }[];
    expect(els.map((e) => e.position)).toEqual([1, 2]);
    expect(els[1].item).toMatch(/^https?:\/\/.*\/en\/models$/);
  });

  it("graph() drops null/undefined nodes", () => {
    const g = graph(organizationNode(), null, undefined, faqNode([{ q: "a", a: "b" }]));
    expect((g["@graph"] as unknown[]).length).toBe(2);
  });

  it("faqNode maps Q&A to Question/acceptedAnswer", () => {
    const f = faqNode([{ q: "What is GQA?", a: "Grouped-query attention." }]);
    const m = f.mainEntity as { "@type": string; name: string; acceptedAnswer: { text: string } }[];
    expect(m[0]["@type"]).toBe("Question");
    expect(m[0].name).toBe("What is GQA?");
    expect(m[0].acceptedAnswer.text).toBe("Grouped-query attention.");
  });

  it("dataset, itemList, techArticle, learningResource, softwareApplication carry the right @type", () => {
    expect(datasetNode({ locale: "en", path: "/en/models", name: "n", description: "d", count: 9 })["@type"]).toBe("Dataset");
    expect(itemListNode([{ name: "x", path: "/en/models/x" }])["@type"]).toBe("ItemList");
    expect(techArticleNode({ locale: "en", path: "/en/models/x", headline: "h", description: "d" })["@type"]).toBe("TechArticle");
    expect(learningResourceNode({ locale: "en", path: "/en/learn", name: "n", description: "d" })["@type"]).toBe("LearningResource");
    const app = softwareApplicationNode({ name: "M", path: "/en/models/m", description: "d", license: "apache-2.0" });
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.license).toBe("apache-2.0");
  });

  it("webApplicationNode is a free utility tied to the org", () => {
    const app = webApplicationNode({ locale: "en", path: "/en/calculator", name: "n", description: "d" });
    expect(app["@type"]).toBe("WebApplication");
    expect(app.applicationCategory).toBe("UtilitiesApplication");
    expect(app.url).toContain("/en/calculator");
    expect(app.isAccessibleForFree).toBe(true);
  });

  it("webPageNode ties to site + supports CollectionPage", () => {
    const p = webPageNode({ locale: "en", path: "/en/models", name: "n", description: "d", type: "CollectionPage" });
    expect(p["@type"]).toBe("CollectionPage");
    expect((p.isPartOf as { "@id": string })["@id"]).toContain("#website");
  });
});
