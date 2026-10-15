import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";

const PIE_COLORS = [
  "hsl(146 52% 38%)",
  "hsl(215 75% 22%)",
  "hsl(0 72% 51%)",
  "hsl(43 74% 66%)",
  "hsl(27 87% 67%)",
  "hsl(215 16% 42%)",
  "hsl(197 37% 24%)",
];

const statusLabels = {
  rascunho: "Rascunho",
  pendente_aprovacao: "Aprovação pendente",
  aprovado: "Aprovado",
  enviado: "Enviado",
  em_analise: "Em análise",
  recusado: "Recusado",
  entrevista: "Entrevista",
  cancelada_duplicada: "Cancelada por duplicidade",
};

const compatLabels = {
  alto: "Forte",
  medio: "Média",
  baixo: "Baixa",
};

function EmptyChart({ message }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function DashboardCharts({ statusData, compatData, evolutionData }) {
  const statusChart = (statusData || [])
    .filter((d) => d.count > 0)
    .map((d) => ({ name: statusLabels[d.status] || d.status, value: d.count }));
  const compatChart = (compatData || [])
    .filter((d) => d.count > 0)
    .map((d) => ({ name: compatLabels[d.nivel_compatibilidade] || d.nivel_compatibilidade, value: d.count }));
  const evolutionChart = evolutionData || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Candidaturas por status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieIcon className="h-4 w-4 text-secondary" /> Candidaturas por status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusChart.length === 0 ? (
            <EmptyChart message="Nenhuma candidatura registrada" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {statusChart.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Compatibilidade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-secondary" /> Oportunidades por compatibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {compatChart.length === 0 ? (
            <EmptyChart message="Nenhuma análise realizada" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={compatChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {compatChart.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Evolução */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-secondary" /> Evolução de candidaturas enviadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionChart.length === 0 ? (
            <EmptyChart message="Nenhuma candidatura enviada ainda" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evolutionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Enviadas" fill="hsl(146 52% 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}