import { Trans } from "@lingui/macro";
import IconInfo from "components/info-icon";
import { useAtomValue } from "jotai";
import {
    rsrExchangeRateAtom,
    rTokenAtom,
    rTokenDistributionAtom,
    rTokenYieldAtom,
} from "state/atoms";
import { Box, BoxProps, Flex, Grid, Image, Text } from "theme-ui";

const ExchangeRate = (props: BoxProps) => {
    const rate = useAtomValue(rsrExchangeRateAtom);
    const rToken = useAtomValue(rTokenAtom);

    return (
        <Box variant="layout.borderBox" {...props} padding={4}>
            <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
                <Text>
                    1 {rToken?.stToken?.symbol ?? "stRSR"} = {rate} RSR
                </Text>
            </Flex>
        </Box>
    );
};

const Stats = (props: BoxProps) => {
    const distribution = useAtomValue(rTokenDistributionAtom);
    const { stakingApy } = useAtomValue(rTokenYieldAtom);

    return (
        <Box {...props} variant="layout.borderBox" p={0}>
            <Grid gap={0} columns={2}>
                <Box
                    p={4}
                    sx={{
                        borderRight: "1px solid",
                        borderBottom: "1px solid",
                        borderColor: "darkBorder",
                    }}
                >
                    <Text variant="subtitle" mb={3}>
                        <Trans>Your stake</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/trendup.svg" />}
                        title="Est. APY"
                        text={`${stakingApy}%`}
                    />
                </Box>
                <Box p={4} sx={{ borderBottom: "1px solid", borderColor: "darkBorder" }}>
                    <Text variant="subtitle" mb={3}>
                        <Trans>Collateral backing</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/backing.svg" />}
                        title="Current"
                        text={`${distribution.backing}%`}
                    />
                </Box>
                <Box p={4} sx={{ borderRight: "1px solid", borderColor: "darkBorder" }}>
                    <Text variant="subtitle" mb={3}>
                        <Trans>Backing + Insurance</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/insurance.svg" />}
                        title="Current"
                        text={`${distribution.backing + distribution.insurance}%`}
                    />
                </Box>
            </Grid>
        </Box>
    );
};

const About = (props: BoxProps) => (
    <Box variant="layout.borderBox" p={4} {...props}>
        <Text variant="strong" mb={2}>
            <Trans>Insurance</Trans>
        </Text>
        <Text as="p" variant="legend">
            <Trans>When take insurace.</Trans>
        </Text>
        <Text variant="strong" mb={2} mt={4}>
            <Trans>Mechanics</Trans>
        </Text>
        <Text as="p" variant="legend">
            <Trans>When take insurace.</Trans>
        </Text>
        <Text variant="strong" mb={2} mt={4}>
            <Trans>Claim Insurance</Trans>
        </Text>
        <Text as="p" variant="legend">
            <Trans>When take insurace.</Trans>
        </Text>
    </Box>
);

const Overview = (props: BoxProps) => {
    return (
        <Box {...props}>
            <ExchangeRate />
            <Stats mt={4} />
            <About mt={4} />
        </Box>
    );
};

export default Overview;
