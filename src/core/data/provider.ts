import type { DataSource } from "@/core/data/contracts";
import { mockDataSource } from "@/core/data/mock";

/**
 * Escolhe a implementação dos repositórios.
 *
 * Este é o único arquivo que precisa mudar quando o backend existir: acrescenta
 * o `httpDataSource` e o seleciona por variável de ambiente. Nenhum componente,
 * nenhum hook e nenhuma tela participam dessa troca — é essa a prova de que a
 * interface não está acoplada aos dados falsos.
 */

type DataSourceKind = "mock" | "api";

const configured = (process.env.NEXT_PUBLIC_DATA_SOURCE ??
  "mock") as DataSourceKind;

function resolveDataSource(kind: DataSourceKind): DataSource {
  switch (kind) {
    case "mock":
      return mockDataSource;
    case "api":
      throw new Error(
        "A fonte de dados 'api' ainda não foi implementada. " +
          "Crie src/core/data/http/ e registre-a aqui.",
      );
    default:
      return mockDataSource;
  }
}

export const dataSource: DataSource = resolveDataSource(configured);
