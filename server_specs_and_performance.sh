#!/bin/bash

# Description:
# server_specs_and_performance.sh is a comprehensive shell script designed to provide an easy-to-read
# summary of a server's hardware specifications and performance metrics. Specifically, the script:
#
# 1. Benchmarks CPU and I/O performance:
#    - Runs `vmstat` every 5 seconds for 1 minute to collect performance metrics.
#    - Analyzes metrics such as `r`, `us`, `sy`, `id`, `wa`, `bi`, and `bo` to determine if there are 
#      potential issues with CPU or disk I/O performance.
#    - Provides recommendations based on the analysis, such as increasing the number of CPUs or 
#      investigating disk performance issues.
#
# 2. Displays hardware specifications:
#    - Number of CPU cores, CPU model, and CPU speed.
#    - Total, free, and available memory.
#    - Storage information including mount path, size, used, and available space.
#
# 3. Handles potential errors gracefully to ensure the output is easy to read and understand.

# Global variables
CPU_INFO_FILE="/proc/cpuinfo"
MEM_INFO_FILE="/proc/meminfo"
DISK_INFO_CMD="df -h --output=source,size,used,avail,pcent,target"
VMSTAT_CMD="vmstat 5 12"
VMSTAT_OUTPUT="/tmp/vmstat_output.txt"

CPU_CORES=$(grep -c '^processor' "$CPU_INFO_FILE")
CPU_MODEL=$(grep -m 1 'model name' "$CPU_INFO_FILE" | awk -F: '{print $2}' | xargs)
CPU_SPEED=$(grep -m 1 'cpu MHz' "$CPU_INFO_FILE" | awk -F: '{print $2}' | xargs)
TOTAL_MEM=$(grep -i 'MemTotal' "$MEM_INFO_FILE" | awk '{print $2}')
FREE_MEM=$(grep -i 'MemFree' "$MEM_INFO_FILE" | awk '{print $2}')
AVAILABLE_MEM=$(grep -i 'MemAvailable' "$MEM_INFO_FILE" | awk '{print $2}')
TOTAL_MEM_HUMAN=$(awk "BEGIN {printf \"%.2f GB\", $TOTAL_MEM / 1024 / 1024}")
FREE_MEM_HUMAN=$(awk "BEGIN {printf \"%.2f GB\", $FREE_MEM / 1024 / 1024}")
AVAILABLE_MEM_HUMAN=$(awk "BEGIN {printf \"%.2f GB\", $AVAILABLE_MEM / 1024 / 1024}")
DISK_INFO=$(eval "$DISK_INFO_CMD")

# Function to display CPU information
display_cpu_info() {
    printf "\n=== CPU Information ===\n"
    printf "Model       : %s\n" "$CPU_MODEL"
    printf "Cores       : %d\n" "$CPU_CORES"
    printf "Speed       : %.2f MHz\n" "$CPU_SPEED"
}

# Function to display Memory information
display_memory_info() {
    printf "\n=== Memory Information ===\n"
    printf "Total Memory     : %s\n" "$TOTAL_MEM_HUMAN"
    printf "Free Memory      : %s\n" "$FREE_MEM_HUMAN"
    printf "Available Memory : %s\n" "$AVAILABLE_MEM_HUMAN"
}

# Function to display Disk information
display_disk_info() {
    printf "\n=== Disk Information ===\n"
    printf "%s\n" "$DISK_INFO"
}

# Function to display VMStat summary
display_vmstat_summary() {
    printf "\n=== VMStat Summary ===\n"
    if [[ -f "$VMSTAT_OUTPUT" ]]; then
        awk '
        BEGIN {
            r_sum = 0; us_sum = 0; sy_sum = 0; id_sum = 0; wa_sum = 0; bi_sum = 0; bo_sum = 0;
            count = 0;
        }
        NR > 2 {
            r_sum += $1; us_sum += $13; sy_sum += $14; id_sum += $15; wa_sum += $16; bi_sum += $9; bo_sum += $10;
            count++;
        }
        END {
            r_avg = r_sum / count;
            us_avg = us_sum / count;
            sy_avg = sy_sum / count;
            id_avg = id_sum / count;
            wa_avg = wa_sum / count;
            bi_avg = bi_sum / count;
            bo_avg = bo_sum / count;

            printf "Average r  : %.2f\n", r_avg;
            printf "Average us : %.2f\n", us_avg;
            printf "Average sy : %.2f\n", sy_avg;
            printf "Average id : %.2f\n", id_avg;
            printf "Average wa : %.2f\n", wa_avg;
            printf "Average bi : %.2f\n", bi_avg;
            printf "Average bo : %.2f\n", bo_avg;

            if (r_avg > ENVIRON["CPU_CORES"]) {
                printf "\nRecommendation: Increase the number of CPUs. (Average r is higher than the number of CPUs)\n";
            }
            if (wa_avg > 10) {
                printf "\nRecommendation: Investigate disk performance. (Average wa is high)\n";
            }
            if (bi_avg > 1000 || bo_avg > 1000) {
                printf "\nRecommendation: Investigate disk performance. (High bi and bo values indicate heavy disk I/O)\n";
            }
        }' "$VMSTAT_OUTPUT"
    else
        printf "Error: VMStat output file not found.\n" >&2
    fi
}

# Function to run VMStat and collect data
collect_vmstat_data() {
    printf "Collecting VMStat data... (This will take 1 minute)\n"
    if ! $VMSTAT_CMD > "$VMSTAT_OUTPUT"; then
        printf "Error: Failed to collect VMStat data.\n" >&2
        return 1
    fi
}

# Main function
main() {
    collect_vmstat_data
    display_vmstat_summary
    display_cpu_info
    display_memory_info
    display_disk_info
}

main

