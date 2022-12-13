import { t, Trans } from "@lingui/macro";
import { useFormContext } from "react-hook-form";
import { Box, BoxProps, Divider, Flex, Text } from "theme-ui";
import { formatCurrency, getTime } from "utils";

interface InfoProps extends BoxProps {
    title: string;
    subtitle: string;
    time?: boolean;
}

const Info = ({ title, subtitle, time, ...props }: InfoProps) => {
    return (
        <Box {...props}>
            <Text variant="legend" sx={{ display: "block", fontSize: 0 }}>
                {title}
            </Text>
            <Flex variant="layout.verticalAlign">
                <Text sx={{ fontSize: 2 }}>
                    {subtitle}
                    {!!time && "s"}
                </Text>
                {time && (
                    <Text ml="auto" variant="legend" sx={{ fontSize: 1 }}>
                        {getTime(Number(subtitle))}
                    </Text>
                )}
            </Flex>
        </Box>
    );
};

const TokenConfigurationOverview = () => {
    const { getValues } = useFormContext();
    const data = getValues();

    return (
        <Box p={5}>
            <Text variant="title">
                <Trans>Base Info</Trans>
            </Text>
            <Divider my={3} />
            <Info mt={3} title={t`ETF name`} subtitle={data.name} />
            <Info mt={3} title={t`ETF symbol`} subtitle={data.ticker} />
            {/* <Info mt={3} title={t`Mandate`} subtitle={data.mandate} /> */}
            <Info mt={3} mb={4} title={t`Ownership address`} subtitle={data.ownerAddress} />
        </Box>
    );
};

export default TokenConfigurationOverview;
