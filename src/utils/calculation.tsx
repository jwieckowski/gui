// TYPES
import {
  BlockType,
  MethodType,
  MethodCorrelationType,
  MethodRankingType,
  AllMethodsItem,
  RankingCorrelationType,
  CalculationBodyType,
} from '@/types';

// UTILS
import { getSingleItemByName, getMethodData } from './filtering';
import useValidation from './validation';

const useCalculation = () => {
  const {
    validateMatrixInputData,
    validateMatrixWeightsConnections,
    validateUploadedMatrix,
    validateUserInputMatrixEmpty,
    validateUserInputCrispMatrixZeros,
    validateUserInputCrispMatrixSameValuesInColumn,
    validateUserInputFuzzyMatrixZeros,
    validateUserInputFuzzyMatrixTFN,
    validateUserInputFuzzyMatrixOrder,
    validateCriteriaTypes,
    validateSameCriteriaTypes,
    validateMethodConnection,
    validateUserInputWeights,
    validateUserInputCrispWeightsValues,
    validateUserInputFuzzyWeightsZeros,
    validateUserInputFuzzyWeightsTFN,
    validateUserInputFuzzyWeightsOrder,
  } = useValidation();

  const getMatrixWeightsConnections = (blocks: [] | BlockType[], connections: [] | string[][], matrix: BlockType) => {
    let weightsItems: [] | BlockType[] = [];

    connections.forEach((connection) => {
      if (connection[0] === matrix.id.toString()) {
        weightsItems = [...weightsItems, blocks.filter((block) => block.id === +connection[1])[0]];
      }
    });

    return weightsItems;
  };

  const getWeightsMethodConnections = (
    weightsItems: [] | BlockType[],
    blocks: [] | BlockType[],
    connections: [] | string[][],
  ) => {
    let mcdaItems: [] | BlockType[][] = [];

    weightsItems.forEach((w) => {
      let mcdaMethodItems: [] | BlockType[] = [];
      connections.forEach((connection) => {
        if (connection[0] === w.id.toString()) {
          mcdaMethodItems = [...mcdaMethodItems, blocks.filter((block) => block.id === +connection[1])[0]];
        }
      });
      // if no connection from weight then insert empty array
      if (!connections.map((c) => c[0]).includes(w.id.toString())) {
        mcdaMethodItems = [];
      }
      if (mcdaMethodItems.length > 0) {
        mcdaItems = [...mcdaItems, [...mcdaMethodItems]];
      }
    });

    return mcdaItems;
  };

  const getMethodsParams = (mcdaItems: [] | BlockType[][], matrixIdx: number, extension: string) => {
    let params: [] | any = [];
    mcdaItems.forEach((items) => {
      items.forEach((item) => {
        params = [
          ...params,
          {
            extension: extension,
            // additional: item.data.additionals[matrixIdx] === undefined ? {} : item.data.additionals[matrixIdx],
            method: item.name,
          },
        ];
      });
    });

    params = [
      ...params.map((param: any) => {
        let additionals = {};
        if (Object.keys(param.additional).length > 0) {
          additionals = param.additional.reduce(
            (a: any, v: any) => ({
              ...a,
              [Object.keys(v)[0]]: v[Object.keys(v)[0]],
            }),
            {},
          );
        }
        return { ...param, additional: additionals };
      }),
    ];

    return params;
  };

  const createWeightMethodPair = (weightsItems: [] | BlockType[], mcdaItems: [] | BlockType[][]) => {
    let methodItem: MethodType[] = [];

    weightsItems.forEach((item, index) => {
      mcdaItems[index]?.forEach((mcda) => {
        methodItem = [
          ...methodItem,
          {
            method: mcda.name,
            weights:
              item.name === 'input'
                ? `${item.data.weights[0]}`.includes(',')
                  ? item.data.weights
                  : item.data.weights.map((w) => +w)
                : item.name,
          },
        ];
      });
    });

    return methodItem;
  };

  const getMethodCorrelationConnections = (
    blocks: [] | BlockType[],
    connections: [] | string[][],
    weightsItems: [] | BlockType[],
    mcdaItems: [] | BlockType[][],
    allMethods: [] | AllMethodsItem[],
  ) => {
    const correlationBlocks = blocks
      .filter((block) => block.type === 'correlation')
      .filter((block) =>
        allMethods
          .filter((item) => item.key.toLowerCase() === block.type.toLowerCase())[0]
          // .data.filter((i) => i.requiredData.includes('preferences' as never))
          .data.filter((i) => i.inputConnections.includes('method' as never))
          .map((i) => i.name.toLowerCase())
          .includes(block.name.toLowerCase() as never),
      );
    let methodCorrelationItem: [] | MethodCorrelationType[] = [];

    correlationBlocks.forEach((corr) => {
      const methodCorrelation: MethodCorrelationType = {
        correlation: blocks.filter((b) => b.id === corr.id)[0].name,
        data: [],
      };
      weightsItems.forEach((weights, index) => {
        mcdaItems[index].forEach((mcda) => {
          if (connections.filter((conn) => +conn[0] === mcda.id && +conn[1] === corr.id).length > 0) {
            if (connections.filter((conn) => +conn[0] === corr.id && +conn[1] === corr.id).length > 0) {
              methodCorrelation.data = [
                ...methodCorrelation.data,
                {
                  method: mcda.name,
                  weights: weights.name,
                  correlation: true,
                },
              ];
            } else {
              methodCorrelation.data = [
                ...methodCorrelation.data,
                {
                  method: mcda.name,
                  weights: weights.name,
                  correlation: false,
                },
              ];
            }
          }
        });
      });
      methodCorrelationItem = [...methodCorrelationItem, methodCorrelation];
    });
    return methodCorrelationItem;
  };

  const getMethodRankingConnections = (
    blocks: [] | BlockType[],
    connections: [] | string[][],
    weightsItems: [] | BlockType[],
    mcdaItems: [] | BlockType[][],
    allMethods: [] | AllMethodsItem[],
  ) => {
    const rankingBlocks = blocks.filter((block) => block.type === 'ranking');
    let methodRankingItem: [] | MethodRankingType[] = [];

    rankingBlocks.forEach((block) => {
      const blockConnections = connections.filter(
        (c) =>
          c[1] === block.id.toString() && mcdaItems.filter((items) => items.filter((i) => i.id === +c[0]).length > 0),
      );
      const methodRanking: MethodRankingType = { data: [] };

      weightsItems.forEach((item, index) => {
        mcdaItems[index] && mcdaItems[index].length > 0
          ? mcdaItems[index].forEach((mcda) => {
              if (blockConnections.map((bc) => bc[0]).includes(`${mcda.id}`)) {
                const data = getSingleItemByName(
                  getMethodData(allMethods, 'Method'),
                  blocks.filter((block) => block.id === mcda.id)[0].name,
                );
                methodRanking.data = [
                  ...methodRanking.data,
                  {
                    method: mcda.name,
                    weights: item.name,
                    order: data?.order ? data.order : '',
                    ranking: true,
                  },
                ];
              } else {
                methodRanking.data = [
                  ...methodRanking.data,
                  {
                    method: mcda.name,
                    weights: item.name,
                    order: '',
                    ranking: false,
                  },
                ];
              }
            })
          : (methodRanking.data = [...methodRanking.data]);
      });

      if (methodRanking.data.length > 0) {
        methodRankingItem = [...methodRankingItem, methodRanking];
      }
    });

    return methodRankingItem;
  };

  const getRankingCorrelationConnections = (
    blocks: [] | BlockType[],
    connections: [] | string[][],
    weightsItems: [] | BlockType[],
    mcdaItems: [] | BlockType[][],
    allMethods: [] | AllMethodsItem[],
  ) => {
    const rankingBlocks = blocks.filter((block) => block.type === 'ranking');
    const correlationBlocks = blocks
      .filter((block) => block.type === 'correlation')
      .filter((block) =>
        allMethods
          .filter((item) => item.key.toLowerCase() === block.type.toLowerCase())[0]
          // .data.filter((i) => i.requiredData.includes('ranking' as never))
          .data.filter((i) => i.inputConnections.includes('ranking' as never))
          .map((i) => i.name.toLowerCase())
          .includes(block.name.toLowerCase() as never),
      );
    let rankingCorrelationItem: [] | RankingCorrelationType[] = [];

    correlationBlocks.forEach((corr) => {
      const rankingCorrelation: RankingCorrelationType = {
        correlation: blocks.filter((b) => b.id === corr.id)[0].name,
        data: [],
      };
      weightsItems.forEach((weights, index) => {
        mcdaItems[index].forEach((mcda) => {
          rankingBlocks.forEach((rank) => {
            if (connections.filter((conn) => +conn[0] === mcda.id && +conn[1] === rank.id).length > 0) {
              if (connections.filter((conn) => +conn[0] === rank.id && +conn[1] === corr.id).length > 0) {
                const data = getSingleItemByName(
                  getMethodData(allMethods, 'Method'),
                  blocks.filter((block) => block.id === mcda.id)[0].name,
                );
                rankingCorrelation.data = [
                  ...rankingCorrelation.data,
                  {
                    method: mcda.name,
                    weights: weights.name,
                    order: data?.order ? data.order : '',
                    correlation: true,
                  },
                ];
              } else {
                rankingCorrelation.data = [
                  ...rankingCorrelation.data,
                  {
                    method: mcda.name,
                    weights: weights.name,
                    order: '',
                    correlation: false,
                  },
                ];
              }
            }
          });
        });
      });
      rankingCorrelationItem = [...rankingCorrelationItem, rankingCorrelation];
    });
    return rankingCorrelationItem;
  };

  const getCalculateBody = (blocks: BlockType[], connections: string[][], allMethods: AllMethodsItem[]) => {
    let calculate = true;
    const body: CalculationBodyType = {
      matrix: [],
      extensions: [],
      types: [],
      method: [],
      methodCorrelations: [],
      methodRankings: [],
      rankingCorrelations: [],
      params: [],
    };

    let matrixIndexes: [] | number[] = [];
    // CHECK CONNECTIONS FROM MATRIX TO WEIGHTS BLOCKS
    const matrices = blocks.filter((block) => block.type.includes('matrix'));
    if (!validateMatrixInputData(matrices)) return;

    // FOR EACH MATRIX CREATE A CALCULATION MODEL CONNECTION
    matrices.forEach((matrix, matrixIdx) => {
      calculate = true;
      // GET WEIGHTS BLOCKS CONNECTED TO CURRENT MATRIX
      const weightsItems = getMatrixWeightsConnections(blocks, connections, matrix);

      if (!validateMatrixWeightsConnections(weightsItems, matrix.id)) {
        calculate = false;
        return;
      }

      if (!validateUploadedMatrix(matrix, matrix.id)) {
        calculate = false;
        return;
      }

      if (!validateUserInputMatrixEmpty(matrix, matrix.id)) {
        calculate = false;
        return;
      }

      if (matrix.data.extension === 'crisp') {
        if (!validateUserInputCrispMatrixZeros(matrix, matrix.id)) {
          calculate = false;
          return;
        }
        if (!validateUserInputCrispMatrixSameValuesInColumn(matrix, matrix.id)) {
          calculate = false;
          return;
        }
      } else if (matrix.data.extension === 'fuzzy') {
        if (!validateUserInputFuzzyMatrixZeros(matrix, matrix.id)) {
          calculate = false;
          return;
        }
        if (!validateUserInputFuzzyMatrixTFN(matrix, matrix.id)) {
          calculate = false;
          return;
        }
        if (!validateUserInputFuzzyMatrixOrder(matrix, matrix.id)) {
          calculate = false;
          return;
        }
      }

      if (!validateCriteriaTypes(matrix)) {
        calculate = false;
        return;
      }

      // EXTENSIONS
      body.extensions = [...body.extensions, matrix.data.extension];

      // MATRIX ID
      matrixIndexes = [...matrixIndexes, matrix.id];

      // MATRIX
      if (['input', 'file'].includes(matrix.name)) {
        if (matrix.data.extension === 'crisp') {
          body.matrix = [...body.matrix, matrix.data.matrix.map((row: string[]) => row.map((col) => +col))];
        } else {
          body.matrix = [...body.matrix, matrix.data.matrix];
        }
      } else if (matrix.name === 'random')
        if (matrix.data?.alternatives && matrix.data?.criteria) {
          const randomMatrix = [matrix.data.alternatives, matrix.data.criteria];
          body.matrix = [...body.matrix, randomMatrix];
        }

      // TYPES
      body.types = [...body.types, matrix.data.criteriaTypes.map((t) => +t)];

      // INPUT WEIGHTS VALIDATION
      weightsItems.forEach((weights) => {
        if (weights.name === 'input') {
          if (!validateUserInputWeights(weights)) {
            calculate = false;
            return;
          }

          if (weights.data.extension === 'crisp') {
            if (!validateUserInputCrispWeightsValues(weights)) {
              calculate = false;
              return;
            }
          } else if (weights.data.extension === 'fuzzy') {
            if (!validateUserInputFuzzyWeightsZeros(weights)) {
              calculate = false;
              return;
            }
            if (!validateUserInputFuzzyWeightsTFN(weights)) {
              calculate = false;
              return;
            }
            if (!validateUserInputFuzzyWeightsOrder(weights)) {
              calculate = false;
              return;
            }
          }
        }
      });

      if (!calculate) return;

      // GET METHODS BLOCKS CONNECTED TO WEIGHTS BLOCKS
      const mcdaItems = getWeightsMethodConnections(weightsItems, blocks, connections);
      calculate = validateMethodConnection(mcdaItems, matrix.id);
      if (!calculate) return;

      calculate = validateSameCriteriaTypes(
        mcdaItems.flatMap((item) => item.map((i) => i.name)),
        matrix.data.criteriaTypes.map((t) => +t),
      );
      if (!calculate) return;

      // ADDITIONAL PARAMS FOR METHODS
      const params = getMethodsParams(mcdaItems, matrixIdx, matrix.data.extension);
      body.params = [...body.params, [...params]];

      const methodItem = createWeightMethodPair(weightsItems, mcdaItems);
      if (methodItem.length > 0) {
        body.method = [...body.method, [...methodItem]];
      }

      // correlations connections -> (method -> correlation)
      const methodCorrelationItem = getMethodCorrelationConnections(
        blocks,
        connections,
        weightsItems,
        mcdaItems,
        allMethods,
      );
      if (methodCorrelationItem.length > 0) {
        body.methodCorrelations = [...body.methodCorrelations, [...methodCorrelationItem]];
      }

      // ranking connections -> (method -> ranking)
      const methodRankingItem = getMethodRankingConnections(blocks, connections, weightsItems, mcdaItems, allMethods);
      if (methodRankingItem.length > 0) {
        body.methodRankings = [...body.methodRankings, [...methodRankingItem]];
      }
      // correlations connections -> (ranking -> correlation)
      const rankingCorrelationItem = getRankingCorrelationConnections(
        blocks,
        connections,
        weightsItems,
        mcdaItems,
        allMethods,
      );
      if (rankingCorrelationItem.length > 0) {
        body.rankingCorrelations = [...body.rankingCorrelations, [...rankingCorrelationItem]];
      }
    });

    return { calculate, body, matrixIndexes };
  };

  return {
    getMatrixWeightsConnections,
    getWeightsMethodConnections,
    getMethodsParams,
    createWeightMethodPair,
    getMethodCorrelationConnections,
    getMethodRankingConnections,
    getRankingCorrelationConnections,
    getCalculateBody,
  };
};

export default useCalculation;
