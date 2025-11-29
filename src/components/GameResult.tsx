import React, { memo, useMemo } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

export interface GameResultProps {
  game: {
    id: string;
    homeTeam: { id: string; name: string; abbreviation: string; logoUrl?: string };
    awayTeam: { id: string; name: string; abbreviation: string; logoUrl?: string };
    homeScore: number;
    awayScore: number;
    homeSpread?: number;
    overUnder?: number;
    status: 'final' | 'in_progress';
    winnerTeamId?: string;
  };
  userPick?: {
    teamId: string;
    isCorrect?: boolean;
  };
}

type ErrorBoundaryState = { hasError: boolean; message?: string };

class ErrorBoundary extends React.Component<{ children: React.ReactNode; componentName?: string }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return { hasError: true, message: err instanceof Error ? err.message : 'Unknown error' };
  }
  componentDidCatch(error: unknown) {
    // console.error('GameResult error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">
            {(this.props.componentName ?? 'Component')} failed to load.
          </p>
          {this.state.message ? <p className="mt-1">{this.state.message}</p> : null}
        </div>
      );
    }
    return this.props.children as JSX.Element;
  }
}

function TeamAvatar(props: { name: string; abbreviation: string; logoUrl?: string }) {
  const { name, abbreviation, logoUrl } = props;
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        loading="lazy"
        decoding="async"
        className="h-7 w-7 rounded object-contain"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-7 w-7 items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-700"
      title={name}
    >
      {abbreviation.toUpperCase()}
    </div>
  );
}

const GameResultInner = (props: GameResultProps) => {
  const { game, userPick } = props;

  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeSpread,
    overUnder,
    winnerTeamId: winnerFromProps,
    status,
  } = game;

  const isFinal = status === 'final';

  const computedWinnerId = useMemo(() => {
    if (winnerFromProps) return winnerFromProps;
    if (!isFinal) return undefined;
    if (homeScore === awayScore) return undefined; // tie or unresolved
    return homeScore > awayScore ? homeTeam.id : awayTeam.id;
  }, [winnerFromProps, isFinal, homeScore, awayScore, homeTeam.id, awayTeam.id]);

  const effectiveIsCorrect = useMemo(() => {
    if (!userPick?.teamId || !isFinal || !computedWinnerId) return undefined;
    if (typeof userPick.isCorrect === 'boolean') return userPick.isCorrect;
    return userPick.teamId === computedWinnerId;
  }, [userPick?.teamId, userPick?.isCorrect, isFinal, computedWinnerId]);

  const borderColor = useMemo(() => {
    if (!isFinal || effectiveIsCorrect === undefined) return 'border-gray-300';
    return effectiveIsCorrect ? 'border-green-500' : 'border-red-500';
  }, [isFinal, effectiveIsCorrect]);

  const rows = [
    {
      team: homeTeam,
      score: homeScore,
    },
    {
      team: awayTeam,
      score: awayScore,
    },
  ];

  return (
    <div
      className={`w-full rounded-md border-2 ${borderColor} bg-white p-3 shadow-sm`}
      aria-label={`Game result: ${awayTeam.abbreviation} at ${homeTeam.abbreviation}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {isFinal ? 'Final' : 'In Progress'}
        </div>
        <div className="text-xs text-gray-500">
          {typeof homeSpread === 'number' && (
            <span className="mr-3">Spread: {homeTeam.abbreviation} {homeSpread >= 0 ? `+${homeSpread}` : homeSpread}</span>
          )}
          {typeof overUnder === 'number' && <span>O/U: {overUnder}</span>}
        </div>
      </div>

      <div className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200">
        {rows.map(({ team, score }) => {
          const isWinner = computedWinnerId === team.id && isFinal;
          const isPicked = userPick?.teamId === team.id;
          const pickCorrect = effectiveIsCorrect === true && isPicked;
          const pickIncorrect = effectiveIsCorrect === false && isPicked;

          return (
            <div
              key={team.id}
              className={`relative flex items-center justify-between gap-2 p-3 sm:p-4 ${isWinner ? 'bg-green-100' : 'bg-white'}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <TeamAvatar name={team.name} abbreviation={team.abbreviation} logoUrl={team.logoUrl} />
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {team.name}
                    </span>
                    {isWinner && (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                        <span role="img" aria-label="Winner trophy">🏆</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{team.abbreviation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums text-gray-900">{score}</span>
                {isPicked && isFinal && (
                  pickCorrect ? (
                    <span
                      className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                      aria-label="Your pick was correct"
                      title="Your pick was correct"
                    >
                      <CheckIcon className="mr-1 h-4 w-4" />
                      Correct
                    </span>
                  ) : pickIncorrect ? (
                    <span
                      className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                      aria-label="Your pick was incorrect"
                      title="Your pick was incorrect"
                    >
                      <XMarkIcon className="mr-1 h-4 w-4" />
                      Incorrect
                    </span>
                  ) : null
                )}
                {isPicked && !isFinal && (
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                    aria-label="You picked this team"
                    title="You picked this team"
                  >
                    Picked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GameResult = memo(GameResultInner);

const GameResultWithBoundary: React.FC<GameResultProps> = (props) => (
  <ErrorBoundary componentName="GameResult">
    <GameResult {...props} />
  </ErrorBoundary>
);

export default GameResultWithBoundary;
export { GameResult as UnwrappedGameResult };
