import { defineCompoundState, DefineEvent, DefineState } from "./";

namespace States {
  export type Idle = DefineState<"idle">;
  export type DirtyReset = DefineState<"dirty_reset">;
  export type Dirty = DefineState<"dirty">;
  export type BuildInProgress = DefineState<
    "build_in_progress",
    {
      generateSourceMap: "test";
      pending: number;
      completed: number;
      start: number;
    }
  >;
  export type BuildComplete = DefineState<
    "build_complete",
    { code: string; sourceMap: string; start: number; end: number }
  >;
  export type BuildError = DefineState<
    "build_error",
    { error: string; start: number; end: number }
  >;
}
type States =
  | States.Idle
  | States.DirtyReset
  | States.Dirty
  | States.BuildInProgress
  | States.BuildComplete
  | States.BuildError;

namespace Events {
  export type FileCreate = DefineEvent<
    "file_create",
    { href: string; content: string }
  >;
  export type FileRemove = DefineEvent<"file_remove", { href: string }>;
  export type FileUpdate = DefineEvent<
    "file_update",
    { href: string; content: string }
  >;
  export type TimerFired = DefineEvent<"timer_fired">;
  export type StartBuild = DefineEvent<
    "start_build",
    { entrypoints: string[]; generateSourceMap: "test" }
  >;
  export type BuildProgress = DefineEvent<
    "build_progress",
    { pending: number; completed: number; start: number }
  >;
  export type BuildComplete = DefineEvent<
    "build_complete",
    { code: string; sourceMap: string; start: number; end: number }
  >;
  export type BuildError = DefineEvent<
    "build_error",
    { error: string; start: number; end: number }
  >;
}

type Events =
  | Events.FileCreate
  | Events.FileRemove
  | Events.FileUpdate
  | Events.TimerFired
  | Events.StartBuild
  | Events.BuildProgress
  | Events.BuildComplete
  | Events.BuildError;

defineCompoundState<States, Events>((builder) =>
  builder
    .onEnterTransition("idle")
    .onEventTransition("file_create", "dirty_reset")
    .onEventTransition("file_remove", "dirty_reset")
    .onEventTransition("file_update", "dirty_reset")
    .onEventTransition("start_build", "build_in_progress", () => ({
      completed: 0,
      generateSourceMap: "test",
      pending: 0,
      start: 0,
    }))
    .defineState("dirty_reset", builder =>
      builder.onEnterTransition('dirty')
    )
    .defineState('dirty', builder => 
    builder.onEnterFireAfter(200, 'build_in_progress'))
);
