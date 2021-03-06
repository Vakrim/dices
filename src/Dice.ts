import { ProbabilityMap } from "./ProbabilityMap";

export class Dice<T> {
  private probabilities: ProbabilityMap<T>;

  constructor(probabilities: ProbabilityMap<T>);
  constructor(primitivePossibilites: [T, number][]);
  constructor(arg: ProbabilityMap<T> | [T, number][]) {
    if (arg instanceof ProbabilityMap) {
      this.probabilities = arg;
    } else {
      this.probabilities = new ProbabilityMap(increase => {
        arg.forEach(probability => {
          increase(probability[0], probability[1]);
        });
      });
    }
  }

  static create(sides: number): Dice<number> {
    const primitivePossibilites: [number, number][] = [];
    for (let i = 1; i <= sides; i++) {
      primitivePossibilites.push([i, 1]);
    }

    return new Dice(primitivePossibilites);
  }

  static always<T>(value: T) {
    return new Dice([[value, 1]]);
  }

  when<R>(
    condition: (value: T) => boolean,
    ifTrue: (value: T) => R,
    ifFalse: (value: T) => R
  ): Dice<R> {
    return this.map(value => {
      if (condition(value)) {
        return ifTrue(value);
      } else {
        return ifFalse(value);
      }
    });
  }

  debug() {
    return [...this.probabilities].map(([v, k]) => [k, v]);
  }

  getProbabilityOf(value: T): number {
    return this.probabilities.getProbabilityOf(value);
  }

  combine<G, R>(
    other: Dice<G>,
    combiner: (value: T, otherValue: G) => R
  ): Dice<R> {
    const result = new ProbabilityMap<R>(increase => {
      for (let [value, thisProbability] of this.probabilities) {
        for (let [otherValue, otherProbability] of other.probabilities) {
          increase(
            combiner(value, otherValue),
            thisProbability * otherProbability
          );
        }
      }
    });

    return new Dice(result);
  }

  map<G>(mapper: (value: T) => G): Dice<G> {
    const result = new ProbabilityMap<G>(increase => {
      for (let [value, thisProbability] of this.probabilities) {
        increase(mapper(value), thisProbability);
      }
    });

    return new Dice<G>(result);
  }

  mapTo<R>(mapper: (value: T) => Dice<R>): Dice<R> {
    const result = new ProbabilityMap<R>(increase => {
      for (let [value, thisProbability] of this.probabilities) {
        const dice = mapper(value);

        for (let [otherValue, otherProbability] of dice.probabilities) {
          increase(otherValue, thisProbability * otherProbability);
        }
      }
    });

    return new Dice(result);
  }

  simplify(threshold: number = 0.005): Dice<T> {
    const result = new ProbabilityMap<T>(increase => {
      for (let [value, thisProbability] of this.probabilities) {
        if (thisProbability > threshold) {
          increase(value, thisProbability);
        }
      }
    });

    return new Dice<T>(result);
  }

  toString(): string {
    return [...this.probabilities]
      .map(([v, k]) => `${JSON.stringify(v)} with ${(k * 100).toFixed(2)}%`)
      .join("\n");
  }

  get pairs(): [T, number][] {
    return [...this.probabilities]
  }
}