const { rest } = require("./supabase");

const propertyType = /^(casa|apartamento|terreno|sobrado|kitnet|sala comercial|chácara)(?=\s|$)/iu;
const cityName = /^\p{Lu}[\p{L}'’-]*(?:\s+(?:(?:de|da|das|do|dos)\s+)?\p{Lu}[\p{L}'’-]*)*$/u;
const purposes = new Map([
  ["morar", "Moradia"],
  ["investir", "Investimento"],
  ["temporada", "Temporada"]
]);

function extractAddress(text) {
  const declaration = text.match(/(?:^|[.!?;,]\s*)(?:meu endere[çc]o [ée]|moro n[ao])\s+([^!?;]+)/iu)?.[1];
  if (!declaration) return null;

  const address = declaration
    .split(/(?<!\b(?:av|r|rod|dr|dra|prof|ap|bl|n))\.\s+(?=[\p{L}])/iu)[0]
    .replace(/\.$/u, "").trim();
  const startsWithAddress = /^(?:rua|r\.|avenida|av\.|travessa|alameda|estrada|rodovia|rod\.|praça|largo|bairro|loteamento|quadra|servidão)(?=\s)/iu.test(address);
  return startsWithAddress ? address : null;
}

function extractQualification(message) {
  const text = message.normalize("NFC").replace(/\s+/g, " ").trim();
  const fields = {};
  const name = text.match(/(?:^|[.!?;,]\s*)(?:meu nome [ée]|me chamo)\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,5})(?=[.!;,]|$)/iu)?.[1];
  if (name && !/\b(?:mas|ou|procuro|busco|prefiro|sou|não|nao)\b/iu.test(name)) {
    fields.name = name;
  }

  const search = text.match(/(?:^|[.!?;,]\s*|\s+e\s+)(?:eu\s+)?(?:procuro|busco|estou procurando|estou buscando)\s+(?:uma?\s+)?([^.!?;,]+)/iu)?.[1]?.trim();
  const purpose = (search ?? text).match(/(?:^|\s)para\s+(morar|investir|temporada)$/iu)?.[1]
    ?? (!search ? text.match(/^para\s+(morar|investir|temporada)[.!]?$/iu)?.[1] : undefined);
  const property = search?.match(propertyType)?.[1];
  if (property && !/\b(?:ou|talvez)\b/iu.test(search)) {
    const suffix = search.slice(property.length)
      .replace(/\s+para\s+(?:morar|investir|temporada)$/iu, "").trim();
    const city = suffix.match(/^em\s+(.+)$/iu)?.[1];
    const label = property[0].toLocaleUpperCase("pt-BR") + property.slice(1).toLocaleLowerCase("pt-BR");
    fields.interest = city && cityName.test(city) ? `${label} em ${city}` : label;
  }
  if (purpose && (search ? !/\b(?:não|nao|ou|talvez)\b/iu.test(search) : /^para\s/iu.test(text))) {
    fields.purpose = purposes.get(purpose.toLocaleLowerCase("pt-BR"));
  }
  const address = extractAddress(text);
  if (address) fields.address = address;
  return fields;
}

async function qualifyClient(clientId, message) {
  const fields = Object.entries(extractQualification(message));
  await Promise.all(fields.map(([field, value]) => rest("clients", {
    id: `eq.${clientId}`,
    or: `(${field}.is.null,${field}.eq.)`
  }, {
    method: "PATCH",
    body: { [field]: value },
    prefer: "return=minimal"
  })));
}

module.exports = { extractQualification, qualifyClient };
