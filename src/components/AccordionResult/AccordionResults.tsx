import { useTranslation } from 'react-i18next';

import { Container, Stack, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// REDUX
import { useAppSelector } from '@/state';

// COMPONENTS
import Table from '@/components/Table';

// UTILS
import { getTableLabels } from '@/utils/results';

// TYPES
import { ResultsNode, ResultsType } from '@/types';

type AccordionResultsType = {
  matrixId: number;
  defaultExpanded?: boolean;
};

export default function AccordionResults({ matrixId, defaultExpanded }: AccordionResultsType) {
  const { results } = useAppSelector((state) => state.calculation);

  const { t } = useTranslation();

  const getNodesOfType = (nodes: ResultsNode[], type: ResultsNode['node_type']) => {
    return nodes.filter((node) => node.node_type === type);
  };

  const getNodeDataForMatrix = (nodes: ResultsNode[], matrixId: number) => {
    return nodes
      .filter((node) => node.data.filter((item) => item.matrix_id === matrixId).length > 0)
      .map((node) => {
        return {
          ...node,
          data: [...node.data.filter((item) => item.matrix_id === matrixId)],
        };
      });
  };

  const getNodeData = (nodes: ResultsNode[], type: ResultsNode['node_type']) => {
    const nodesType = getNodesOfType(nodes, type);
    return getNodeDataForMatrix(nodesType, matrixId);
  };

  const getWeightsTableData = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'weights').map((node) => node.data[0].weights);
  };

  const getWeightsTableLabel = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'weights').map((node) => node.method);
  };

  const getWeightsTable = (nodes: ResultsNode[]) => {
    const data = getWeightsTableData(nodes);

    if (data.length === 0) return null;

    return (
      <Table
        data={data}
        labels={getWeightsTableLabel(results)}
        headers={getTableLabels(data[0].length)}
        title={`${t('results:weights')}`}
        precision={3}
      />
    );
  };

  const getMatrixTable = (nodes: ResultsNode[]) => {
    const matrix = getNodesOfType(nodes, 'matrix').find((node) => node.id === matrixId);

    if (!matrix) return null;

    return (
      <Table
        data={matrix.data[0].matrix}
        labels={getTableLabels(matrix.data[0].matrix.length, 'A')}
        headers={getTableLabels(matrix.data[0].matrix[0].length)}
        title={`${t('results:matrix')}`}
        precision={3}
      />
    );
  };

  const getMethodTableData = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'method').map((node) => node.data[0].preference);
  };

  const getMethodTableLabel = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'method').flatMap((node) =>
      node.data.map((item) => `${node.method} | ${item.weights_method}`),
    );
  };

  const getMethodTable = (nodes: ResultsNode[]) => {
    const data = getMethodTableData(nodes);

    if (data.length === 0) return null;

    return (
      <Table
        data={data}
        labels={getMethodTableLabel(results)}
        headers={getTableLabels(data[0].length, 'A')}
        title={`${t('results:preferences')}`}
        precision={3}
      />
    );
  };

  const getRankingTableData = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'ranking').map((node) => node.data.map((item) => item.ranking));
  };

  const getRankingTableLabel = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'ranking').map((node) =>
      node.data.map((item) => `${item.method} | ${item.weights_method}`),
    );
  };

  const getRankingsID = (nodes: ResultsNode[0]) => {
    return getNodeData(nodes, 'ranking').map((node) => node.id);
  };

  const getRankingTable = (nodes: ResultsNode[]) => {
    const data = getRankingTableData(nodes);

    if (data.length === 0) return null;

    const labels = getRankingTableLabel(results);
    const rankingIDs = getRankingsID(nodes);

    return data.map((item, idx) => {
      return (
        <Table
          key={`${matrixId}-${labels[idx].join(',')}`}
          data={item}
          labels={labels[idx]}
          headers={getTableLabels(item[0].length, 'A')}
          title={`${t('results:ranking')} (ID ${rankingIDs[idx]})`}
        />
      );
    });
  };

  const getCorrelationTableData = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'correlation').map((node) => node.data[0].correlation);
  };

  const getCorrelationTableLabel = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'correlation').map((node) => node.data[0].labels);
  };

  const getCorrelationTableTitle = (nodes: ResultsNode[]) => {
    return getNodeData(nodes, 'correlation').map((item) => `${item.method} (ID ${item.id})`);
  };

  const getCorrelationTable = (nodes: ResultsNode[]) => {
    const data = getCorrelationTableData(nodes);

    if (data.length === 0) return null;

    const labels = getCorrelationTableLabel(results);
    const titles = getCorrelationTableTitle(results);

    return data.map((item, idx) => {
      return (
        <Table
          key={`${titles[idx]}-${matrixId}-${labels[idx].join(',')}`}
          data={item}
          labels={labels[idx]}
          headers={labels[idx]}
          title={titles[idx]}
          precision={3}
        />
      );
    });
  };

  return (
    <Container disableGutters>
      <Accordion defaultExpanded={defaultExpanded} sx={{ border: '2px solid gray', boxShadow: '0 4px 2px -2px gray' }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`result-${matrixId}-content`}
          id={`result-${matrixId}-header`}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {t('results:matrix').toUpperCase()} (ID {matrixId})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack gap={5}>
            {getMatrixTable(results)}
            {getWeightsTable(results)}
            {getMethodTable(results)}
            {getRankingTable(results)}
            {getCorrelationTable(results)}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}
