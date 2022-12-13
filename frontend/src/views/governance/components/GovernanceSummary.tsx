import { t, Trans } from "@lingui/macro";
import { useFormContext } from "react-hook-form";
import { Box, Text, Flex, BoxProps, Divider, Grid } from "theme-ui";

interface InfoProps extends BoxProps {
    title: string;
    subtitle: string;
}

const Info = ({ title, subtitle, ...props }: InfoProps) => {
    return (
        <Box {...props}>
            <Text variant="legend" sx={{ display: "block", fontSize: 0 }}>
                {title}
            </Text>
            <Flex variant="layout.verticalAlign">
                <Text sx={{ fontSize: 2 }}>{subtitle}</Text>
            </Flex>
        </Box>
    );
};

const GovernanceSummary = () => {
    const { getValues } = useFormContext();
    const {
        defaultGovernance,
        unpause,
        votingDelay, // 5 blocks
        votingPeriod, // 100 blocks
        proposalThresholdAsMicroPercent, // 1%
        quorumPercent, // 4%
        minDelay, // 24 hours -> 86400
        guardian,
        pauser,
        owner,
    } = getValues();

    return (
        <Grid columns={2} mb={3} gap={0} variant="layout.card">
            <Box px={5} py={4} sx={{ borderRight: "1px solid", borderColor: "border" }}>
                <Text variant="title">
                    <Trans>Permissions</Trans>
                </Text>
                <Divider my={3} />
                {!defaultGovernance && (
                    <Info mb={3} title={t`ETF Owner address`} subtitle={owner} />
                )}
                <Info mb={3} title={t`ETF Guardian address`} subtitle={guardian} />
            </Box>
        </Grid>
    );
};

export default GovernanceSummary;
