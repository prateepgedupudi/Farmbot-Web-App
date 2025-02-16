import * as React from "react";
import { Saucer } from "../../../ui/index";
import { ToggleButton } from "../../../controls/toggle_button";
import { updateConfig } from "../../actions";
import { last, isNumber } from "lodash";
import { Content } from "../../../constants";
import { FbosDetailsProps } from "./interfaces";
import { SourceFbosConfig, ShouldDisplay, Feature } from "../../interfaces";
import { ConfigurationName } from "farmbot";
import { t } from "../../../i18next_wrapper";
import { LastSeen } from "./last_seen_row";
import { Popover } from "@blueprintjs/core";

/** Return an indicator color for the given temperature (C). */
export const colorFromTemp = (temp: number | undefined): string => {
  if (!temp) {
    return "gray";
  }
  if (temp < 0) {
    return "lightblue";
  } else if (temp < 10) {
    return "blue";
  } else if (temp > 75) {
    return "red";
  } else if (temp > 60) {
    return "yellow";
  } else {
    return "green";
  }
};

interface ChipTemperatureDisplayProps {
  chip?: string;
  temperature: number | undefined;
}

/** RPI CPU temperature display row: label, temperature, indicator. */
export function ChipTemperatureDisplay(
  { chip, temperature }: ChipTemperatureDisplayProps
): JSX.Element {
  return <div className="chip-temp-display">
    <p>
      <b>{chip && chip.toUpperCase()} {t("CPU temperature")}: </b>
      {temperature ? <span>{temperature}&deg;C</span> : t("unknown")}
    </p>
    <Saucer color={colorFromTemp(temperature)} className={"small-inline"} />
  </div>;
}

interface WiFiStrengthDisplayProps {
  wifiStrength: number | undefined;
  wifiStrengthPercent?: number | undefined;
}

/** WiFi signal strength display row: label, strength, indicator. */
export function WiFiStrengthDisplay(
  { wifiStrength, wifiStrengthPercent }: WiFiStrengthDisplayProps
): JSX.Element {
  const percent = wifiStrength
    ? Math.round(-0.0154 * wifiStrength ** 2 - 0.4 * wifiStrength + 98)
    : 0;
  const dbString = `${wifiStrength || 0}dBm`;
  const percentString = `${wifiStrengthPercent || percent}%`;
  return <div className="wifi-strength-display">
    <p>
      <b>{t("WiFi Strength")}: </b>
      {wifiStrength ? dbString : "N/A"}
    </p>
    {wifiStrength &&
      <div className="percent-bar">
        <div
          className="percent-bar-fill"
          style={{ width: percentString }}
          title={dbString} />
      </div>}
  </div>;
}

/** Available throttle info. */
export enum ThrottleType {
  UnderVoltage = "UnderVoltage",
  ArmFrequencyCapped = "ArmFrequencyCapped",
  Throttled = "Throttled",
  SoftTempLimit = "SoftTempLimit",
}

/** Bit positions for throttle flags. */
const THROTTLE_BIT_LOOKUP:
  Record<ThrottleType, Record<"active" | "occurred", number>> = {
  [ThrottleType.UnderVoltage]: { active: 0, occurred: 16 },
  [ThrottleType.ArmFrequencyCapped]: { active: 1, occurred: 17 },
  [ThrottleType.Throttled]: { active: 2, occurred: 18 },
  [ThrottleType.SoftTempLimit]: { active: 3, occurred: 19 },
};

/** Return a color based on throttle flag states. */
export const colorFromThrottle =
  (throttled: string, throttleType: ThrottleType) => {
    const throttleCode = parseInt(throttled, 16);
    const bit = THROTTLE_BIT_LOOKUP[throttleType];
    // tslint:disable-next-line:no-bitwise
    const active = throttleCode & (1 << bit.active);
    // tslint:disable-next-line:no-bitwise
    const occurred = throttleCode & (1 << bit.occurred);
    if (active) {
      return "red";
    } else if (occurred) {
      return "yellow";
    } else {
      return "green";
    }
  };

const THROTTLE_COLOR_KEY = () => ({
  red: t("active"),
  yellow: t("occurred"),
  green: t("ok")
});

interface ThrottleIndicatorProps {
  throttleDataString: string;
  throttleType: ThrottleType;
}

/** Saucer with color and title indicating throttle state. */
const ThrottleIndicator = (props: ThrottleIndicatorProps) => {
  const { throttleDataString, throttleType } = props;
  const throttleColor = colorFromThrottle(throttleDataString, throttleType);
  return <Saucer className={"small-inline"}
    title={THROTTLE_COLOR_KEY()[throttleColor]}
    color={throttleColor} />;
};

/** Visual representation of throttle state. */
const ThrottleDisplay = (dataString: string) =>
  <div className="throttle-display">
    {Object.keys(THROTTLE_BIT_LOOKUP).map((key: ThrottleType) =>
      <div className="throttle-row" key={key}>
        <ThrottleIndicator throttleDataString={dataString} throttleType={key} />
        <p>{key}</p>
      </div>)}
  </div>;

interface VoltageDisplayProps {
  chip?: string;
  throttled: string | undefined;
}

/** RPI throttle state display row: label, indicator. */
export const VoltageDisplay = ({ chip, throttled }: VoltageDisplayProps) =>
  throttled
    ? <div className="voltage-display">
      <p>
        <b>{chip && chip.toUpperCase()} {t("Voltage")}: </b>
      </p>
      <Popover usePortal={false}>
        <ThrottleIndicator
          throttleDataString={throttled}
          throttleType={ThrottleType.UnderVoltage} />
        {ThrottleDisplay(throttled)}
      </Popover>
    </div> : <div className="voltage-display" />;

/** Get the first 8 characters of a commit. */
const shortenCommit = (longCommit: string) => (longCommit || "").slice(0, 8);

interface CommitDisplayProps {
  title: string;
  repo: string;
  commit: string;
}

/** GitHub commit display row: label, commit link. */
const CommitDisplay = (
  { title, repo, commit }: CommitDisplayProps
): JSX.Element => {
  const shortCommit = shortenCommit(commit);
  return <p>
    <b>{title}: </b>
    {shortCommit === "---"
      ? shortCommit
      : <a
        href={`https://github.com/FarmBot/${repo}/tree/${shortCommit}`}
        target="_blank">
        {shortCommit}
      </a>}
  </p>;
};

interface UptimeDisplayProps {
  uptime_sec: number;
}

/** FBOS uptime display row: label and uptime in relevant unit. */
const UptimeDisplay = ({ uptime_sec }: UptimeDisplayProps): JSX.Element => {
  const convertUptime = (seconds: number) => {
    if (seconds >= 172800) {
      return `${Math.round(seconds / 86400)} ${t("days")}`;
    } else if (seconds >= 7200) {
      return `${Math.round(seconds / 3600)} ${t("hours")}`;
    } else if (seconds >= 120) {
      return `${Math.round(seconds / 60)} ${t("minutes")}`;
    } else {
      return `${seconds} ${t("seconds")}`;
    }
  };
  return <p><b>{t("Uptime")}: </b>{convertUptime(uptime_sec)}</p>;
};

interface BetaReleaseOptInParams {
  sourceFbosConfig: SourceFbosConfig;
  shouldDisplay: ShouldDisplay;
}

/** Generate params for BetaReleaseOptInButton. */
export const betaReleaseOptIn = (
  { sourceFbosConfig, shouldDisplay }: BetaReleaseOptInParams
) => {
  if (shouldDisplay(Feature.use_update_channel)) {
    const betaOptIn = sourceFbosConfig("update_channel" as ConfigurationName);
    const betaOptInValue = betaOptIn.value !== "stable";
    return {
      betaOptIn: { value: betaOptInValue, consistent: true }, betaOptInValue,
      update: { update_channel: betaOptInValue ? "stable" : "beta" }
    };
  } else {
    const betaOptIn = sourceFbosConfig("beta_opt_in");
    const betaOptInValue = betaOptIn.value;
    return {
      betaOptIn, betaOptInValue,
      update: { beta_opt_in: !betaOptInValue }
    };
  }
};

interface BetaReleaseOptInButtonProps {
  dispatch: Function;
  sourceFbosConfig: SourceFbosConfig;
  shouldDisplay: ShouldDisplay;
}

/** Label and toggle button for opting in to FBOS beta releases. */
const BetaReleaseOptInButton = (
  { dispatch, sourceFbosConfig, shouldDisplay }: BetaReleaseOptInButtonProps
): JSX.Element => {
  const { betaOptIn, betaOptInValue, update } =
    betaReleaseOptIn({ sourceFbosConfig, shouldDisplay });
  return <fieldset>
    <label style={{ marginTop: "0.75rem" }}>
      {t("Beta release Opt-In")}
    </label>
    <ToggleButton
      toggleValue={betaOptInValue}
      dim={!betaOptIn.consistent}
      toggleAction={() =>
        (betaOptInValue || confirm(Content.OS_BETA_RELEASES)) &&
        dispatch(updateConfig(update))} />
  </fieldset>;
};

/** Current technical information about FarmBot OS running on the device. */
export function FbosDetails(props: FbosDetailsProps) {
  const {
    env, commit, target, node_name, firmware_version, firmware_commit,
    soc_temp, wifi_level, uptime, memory_usage, disk_usage, throttled,
    wifi_level_percent,
    // tslint:disable-next-line:no-any
  } = props.botInfoSettings as any;

  return <div>
    <LastSeen
      dispatch={props.dispatch}
      botToMqttLastSeen={props.botToMqttLastSeen}
      timeSettings={props.timeSettings}
      device={props.deviceAccount} />
    <p><b>Environment: </b>{env}</p>
    <CommitDisplay title={"Commit"} repo={"farmbot_os"} commit={commit} />
    <p><b>Target: </b>{target}</p>
    <p><b>Node name: </b>{last((node_name || "").split("@"))}</p>
    <p><b>Firmware: </b>{firmware_version}</p>
    <CommitDisplay title={"Firmware commit"}
      repo={"farmbot-arduino-firmware"} commit={firmware_commit} />
    {isNumber(uptime) && <UptimeDisplay uptime_sec={uptime} />}
    {isNumber(memory_usage) &&
      <p><b>{t("Memory usage")}: </b>{memory_usage}MB</p>}
    {isNumber(disk_usage) && <p><b>{t("Disk usage")}: </b>{disk_usage}%</p>}
    <ChipTemperatureDisplay chip={target} temperature={soc_temp} />
    <WiFiStrengthDisplay
      wifiStrength={wifi_level} wifiStrengthPercent={wifi_level_percent} />
    <VoltageDisplay chip={target} throttled={throttled} />
    <BetaReleaseOptInButton
      dispatch={props.dispatch}
      shouldDisplay={props.shouldDisplay}
      sourceFbosConfig={props.sourceFbosConfig} />
  </div>;
}
