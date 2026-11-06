import React from "react";
import { jobSource } from "@/lib/jobSource";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, ExternalLink, Sparkles, Eye } from "lucide-react";

const nivelLabels = {
  estagio: "Estágio",
  trainee: "Trainee",
  junior: "Júnior",
  pleno: "Pleno",
};
const modalidadeLabels = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
  nao_informada: "Modalidade não informada",
};

function formatDate(d) {
  if (!d) return "Data não informada";
  const parts = String(d).slice(0, 10).split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function JobCard({ job, onDetails, onAnalyze }) {
  const source = jobSource(job);
  const fonteLabel = source.label;
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight text-foreground">{job.cargo}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{job.empresa}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-normal">{nivelLabels[job.nivel] || job.nivel}</Badge>
          <Badge variant="outline" className="font-normal">{modalidadeLabels[job.modalidade] || job.modalidade}</Badge>
          {job.localizacao && (
            <Badge variant="outline" className="font-normal">
              <MapPin className="mr-1 h-3 w-3" />{job.localizacao}
            </Badge>
          )}
        </div>

        {job.descricao && (
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.descricao}</p>
        )}

        {Array.isArray(job.requisitos) && job.requisitos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.requisitos.slice(0, 4).map((r, i) => (
              <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r}</span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(job.data_publicacao)}
          </span>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Fonte: {fonteLabel}
            </a>
          ) : (
            <span>Fonte: {fonteLabel}</span>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onDetails(job)}>
            <Eye className="mr-1.5 h-4 w-4" /> Ver detalhes
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onAnalyze(job)}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Analisar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}