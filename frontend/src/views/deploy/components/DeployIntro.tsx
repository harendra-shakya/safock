import { t, Trans } from "@lingui/macro";
import { InfoBox } from "components";
import { SmallButton } from "components/button";
import { Circle } from "react-feather";
import { Box, BoxProps, Flex, Grid, Text } from "theme-ui";

interface InfoBoxProps extends BoxProps {
    title: string;
    subtitle: string;
}

const Title = ({ prefix, text }: { prefix: string; text: string }) => (
    <Box sx={{ borderBottom: "1px solid", borderColor: "border", fontSize: 3 }} py={3}>
        <Text sx={{ color: "secondaryText" }}>{prefix}</Text>
        <Text sx={{ fontWeight: 500 }} pl={2}>
            {text}
        </Text>
    </Box>
);

const StepItem = ({ title, subtitle, ...props }: InfoBoxProps) => (
    <Box variant="layout.verticalAlign" {...props}>
        <Box>
            <Circle size={7} fill="#000" stroke="#999999" />
        </Box>
        <Box ml={3}>
            <Text variant="strong">{title}</Text>
            <Text variant="legend" sx={{ fontSize: 1 }}>
                {subtitle}
            </Text>
        </Box>
    </Box>
);

/**
 * View: Deploy
 *
 * TODO: Info links
 * TODO: Text copy
 */
const DeployIntro = () => {
    // const navigate = useNavigate()

    return (
        // <Grid
        //   columns={2}
        //   sx={{ backgroundColor: 'contentBackground', borderRadius: 10 }}
        // >
        <Box px={5} py={4} sx={{ borderRight: "1px solid", borderColor: "border" }}>
            <Title prefix="Tx" text={t`ETF Deployment`} />
            <StepItem title={t`Set Primary collaterals`} subtitle={t``} mt={4} mb={4} />
            <StepItem title={t`Set ETF parameters`} subtitle={t``} mb={4} />
            <StepItem title={t`Deploy ETF`} subtitle={t``} mb={4} />
            <StepItem title={t`Mint ETF`} subtitle={t``} mb={4} />
        </Box>
    );
};

export default DeployIntro;
