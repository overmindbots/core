import { graphql } from 'react-relay';
import mutate from '~/utils/mutate';

interface Input {
  roleDiscordId: string;
  invitesRequired: number;
  botInstanceId: string;
  originalRank?: {
    id: string;
  };
}

const mutation = graphql`
  mutation ReferralRanksSetRankMutation($input: ReferralRanksSetRankInput!) {
    referralRanksSetRank(input: $input) {
      clientMutationId
      rank {
        id
        invitesRequired
        botInstance {
          id
        }
      }
      deletedRankId
      newRank {
        node {
          id
          invitesRequired
          roleDiscordId
        }
      }
    }
  }
`;

export default async function referralRanksSetRank({
  roleDiscordId,
  invitesRequired,
  botInstanceId,
  originalRank,
}: Input) {
  let optimisticResponse;
  const isDeletion = invitesRequired < 0 && originalRank;
  const isCreation = !originalRank && invitesRequired > 0;
  const isUpdate = originalRank && invitesRequired >= 0;
  if (isDeletion) {
    optimisticResponse = {
      referralRanksSetRank: {
        deletedRankId: originalRank && originalRank.id,
      },
    };
  } else if (isCreation) {
    optimisticResponse = {
      referralRanksSetRank: {
        newRank: {
          node: {
            invitesRequired,
            botInstance: {
              id: botInstanceId,
            },
          },
        },
      },
    };
  } else if (isUpdate) {
    optimisticResponse = {
      referralRanksSetRank: {
        rank: {
          invitesRequired,
          botInstance: {
            id: botInstanceId,
          },
        },
      },
    };
  }

  const res = await mutate({
    mutation,
    variables: {
      input: { roleDiscordId, invitesRequired },
    },
    optimisticResponse,
    configs: [
      {
        type: 'RANGE_DELETE',
        parentName: 'botInstance',
        parentID: botInstanceId,
        connectionKeys: [
          {
            key: 'ReferralRanksRanksList_ranks',
          },
        ],
        pathToConnection: ['botInstance', 'ranks'],
        deletedIDFieldName: 'deletedRankId',
      },
      {
        type: 'RANGE_ADD',
        parentID: botInstanceId,
        connectionInfo: [
          {
            key: 'ReferralRanksRanksList_ranks',
            rangeBehavior: 'prepend',
            filters: [],
          },
        ],
        edgeName: 'newRank',
      },
    ],
  });
  return res;
}
